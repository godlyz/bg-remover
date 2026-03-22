import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

const PLAN_CONFIG: Record<string, { name: string; amount: number; credits?: number; creditsPerMonth?: number }> = {
  credits_10: { name: '积分小包', amount: 4.99, credits: 10 },
  credits_30: { name: '积分中包', amount: 12.99, credits: 30 },
  credits_80: { name: '积分大包', amount: 29.90, credits: 80 },
  monthly_basic: { name: '月订阅基础版', amount: 9.99, creditsPerMonth: 25 },
  monthly_pro: { name: '月订阅进阶版', amount: 19.99, creditsPerMonth: 60 },
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const { planId, planType } = await request.json()
    const plan = PLAN_CONFIG[planId]

    if (!plan) {
      return NextResponse.json(
        { error: 'invalid_plan', message: '无效的套餐' },
        { status: 400 }
      )
    }

    // 验证 planType 和 planId 匹配
    const isCredit = planId.startsWith('credits_')
    if ((planType === 'credit' && !isCredit) || (planType === 'subscription' && isCredit)) {
      return NextResponse.json(
        { error: 'plan_mismatch', message: '套餐类型不匹配' },
        { status: 400 }
      )
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.json(
        { error: 'payment_not_configured', message: '支付系统未配置，请联系管理员' },
        { status: 503 }
      )
    }

    // 获取 PayPal Access Token
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) {
      console.error('PayPal token error:', await tokenRes.text())
      return NextResponse.json(
        { error: 'paypal_error', message: '支付服务暂不可用' },
        { status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()

    // 创建订单
    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: `BGFree ${plan.name}`,
          amount: {
            currency_code: 'USD',
            value: plan.amount.toFixed(2),
          },
          custom_id: `${session.user.id}:${planId}`,
        }],
        application_context: {
          brand_name: 'BGFree',
          return_url: `${process.env.NEXTAUTH_URL || 'https://www.bg-remover.site'}/api/payments/confirm?planId=${planId}&planType=${planType}`,
          cancel_url: `${process.env.NEXTAUTH_URL || 'https://www.bg-remover.site'}/payment?status=cancelled`,
          user_action: 'PAY_NOW',
        },
      }),
    })

    if (!orderRes.ok) {
      console.error('PayPal order error:', await orderRes.text())
      return NextResponse.json(
        { error: 'paypal_error', message: '创建支付订单失败' },
        { status: 502 }
      )
    }

    const order = await orderRes.json()

    // 保存订单到 D1
    const { DB } = (globalThis as any).cloudflare?.env || {}
    if (DB && DB.prepare) {
      await DB.prepare(
        "INSERT INTO payments (id, user_id, paypal_order_id, plan_type, amount, status) VALUES (?, ?, ?, ?, ?, 'pending')"
      ).bind(order.id, session.user.id, order.id, planId, plan.amount).run()
    }

    // 找到 approval URL
    const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href

    if (!approvalUrl) {
      return NextResponse.json(
        { error: 'paypal_error', message: '支付链接生成失败' },
        { status: 502 }
      )
    }

    return NextResponse.json({ orderId: order.id, approvalUrl })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
