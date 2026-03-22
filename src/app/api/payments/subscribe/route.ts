import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

const SUBSCRIPTION_PLANS: Record<string, { planId: string; name: string; creditsPerMonth: number }> = {
  monthly_basic: {
    planId: process.env.PAYPAL_PLAN_BASIC || 'P-3R030751SW877690BNG73LKA',
    name: '基础版',
    creditsPerMonth: 25,
  },
  monthly_pro: {
    planId: process.env.PAYPAL_PLAN_PRO || 'P-37T01020MF214480SNG73LNA',
    name: '进阶版',
    creditsPerMonth: 60,
  },
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

    const { planId } = await request.json()
    const plan = SUBSCRIPTION_PLANS[planId]

    if (!plan) {
      return NextResponse.json(
        { error: 'invalid_plan', message: '无效的订阅套餐' },
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
      return NextResponse.json(
        { error: 'paypal_error', message: '支付服务暂不可用' },
        { status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()

    // 创建 PayPal Subscription
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.bg-remover.site'

    const subRes = await fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.planId,
        application_context: {
          brand_name: 'BGFree',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${baseUrl}/api/payments/subscription/success?planId=${planId}`,
          cancel_url: `${baseUrl}/pricing?status=cancelled`,
        },
        custom_id: `${session.user.id}:${planId}`,
      }),
    })

    if (!subRes.ok) {
      const errData = await subRes.json().catch(() => ({}))
      console.error('PayPal subscription error:', errData)
      return NextResponse.json(
        { error: 'paypal_error', message: '创建订阅失败' },
        { status: 502 }
      )
    }

    const subData = await subRes.json()

    // 保存到 D1
    const { DB } = (globalThis as any).cloudflare?.env || {}
    if (DB && DB.prepare) {
      const subId = `sub_${crypto.randomUUID().replace(/-/g, '')}`
      await DB.prepare(
        "INSERT INTO subscriptions (id, user_id, paypal_subscription_id, plan_type, status, credits_per_month, start_date) VALUES (?, ?, ?, ?, 'pending', ?, datetime('now'))"
      ).bind(subId, session.user.id, subData.id, planId, plan.creditsPerMonth).run()
    }

    // 找 approve 链接
    const approveLink = subData.links?.find((l: any) => l.rel === 'approve')?.href

    if (!approveLink) {
      return NextResponse.json(
        { error: 'paypal_error', message: '支付链接生成失败' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      subscriptionId: subData.id,
      approvalUrl: approveLink,
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
