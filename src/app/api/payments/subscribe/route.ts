import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'

export const runtime = "edge"

const PLAN_CONFIG: Record<string, { credits?: number; creditsPerMonth?: number }> = {
  credits_10: { credits: 10 },
  credits_30: { credits: 30 },
  credits_80: { credits: 80 },
  monthly_basic: { creditsPerMonth: 25 },
  monthly_pro: { creditsPerMonth: 60 },
}

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const { planId } = await request.json()
    const plan = PLAN_CONFIG[planId]

    if (!plan) {
      return NextResponse.json(
        { error: 'invalid_plan', message: '无效的套餐' },
        { status: 400 }
      )
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.json(
        { error: 'payment_not_configured', message: '支付系统未配置' },
        { status: 503 }
      )
    }

    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: 'paypal_error', message: '支付服务暂不可用' },
        { status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.bg-remover.site'

    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: `BGFree 月订阅 - ${planId.replace('_', ' ')}`,
          amount: {
            currency_code: 'USD',
            value: plan.creditsPerMonth ? (plan.creditsPerMonth * 0.40).toFixed(2) : (plan.credits || 0).toFixed(2),
          },
          custom_id: `${session.user.id}:sub:${planId}`,
        }],
        application_context: {
          brand_name: 'BGFree',
          return_url: `${baseUrl}/api/payments/subscription/success?planId=${planId}`,
          cancel_url: `${baseUrl}/payment?status=cancelled`,
          user_action: 'PAY_NOW',
        },
      }),
    })

    if (!orderRes.ok) {
      return NextResponse.json(
        { error: 'paypal_error', message: '创建订单失败' },
        { status: 502 }
      )
    }

    const orderData = await orderRes.json()

    const env = getCloudflareEnv(); const DB = env.DB
    if (DB && DB.prepare) {
      // 确保用户存在
      await DB.prepare(
        "INSERT OR IGNORE INTO users (id, google_id, plan, cloud_used_lifetime) VALUES (?, ?, 'free', 0)"
      ).bind(session.user.id, session.user.id).run()
      await DB.prepare(
        "INSERT INTO payments (id, user_id, paypal_order_id, plan_type, amount, status) VALUES (?, ?, ?, ?, 'pending')"
      ).bind(orderData.id, session.user.id, orderData.id, planId).run()
    }

    const approvalUrl = orderData.links?.find((l: any) => l.rel === 'approve')?.href

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'paypal_error', message: '支付链接生成失败' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      orderId: orderData.id,
      approvalUrl: approvalUrl,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
