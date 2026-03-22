import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

const SUBSCRIPTION_PLANS: Record<string, { name: string; creditsPerMonth: number; amount: number }> = {
  monthly_basic: { name: '基础版', creditsPerMonth: 25, amount: 9.99 },
  monthly_pro: { name: '进阶版', creditsPerMonth: 60, amount: 19.99 },
}

export async function POST(request: NextRequest) {
  try {
    // 先解析 body，再检查登录（避免 auth() 报错导致整个请求失败）
    let planId = ''
    try {
      const body = await request.json()
      planId = body.planId || ''
    } catch {
      return NextResponse.json(
        { error: 'invalid_request', message: '请求格式错误' },
        { status: 400 }
      )
    }

    // 检查登录 — 如果失败，跳登录页
    const { env } = (globalThis as any).cloudflare?.env || {}
    const { DB } = env || {}
    const authHeader = request.headers.get('x-auth-session')

    if (!authHeader) {
      // 尝试用 cookie session
      const cookie = request.headers.get('cookie') || ''
      const sessionMatch = cookie.match(/next-auth\.session-token=([^;]+)/)

      if (!sessionMatch) {
        return NextResponse.json(
          { error: 'unauthorized', message: '请先登录', redirect: '/api/auth/signin' },
          { status: 401 }
        )
      }
    }

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
      console.error('PayPal token error:', tokenRes.status, await tokenRes.text())
      return NextResponse.json(
        { error: 'paypal_error', message: '支付服务暂不可用' },
        { status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.bg-remover.site'

    // 从 cookie 或 header 获取 userId
    let userId = ''
    if (authHeader) {
      try {
        const session = JSON.parse(authHeader)
        userId = session?.user?.id || ''
      } catch {}
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: '无法识别用户，请重新登录', redirect: '/api/auth/signin' },
        { status: 401 }
      )
    }

    // 用一次性支付方式创建月订阅订单
    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: `BGFree ${plan.name} - 月订阅（首月）`,
          amount: {
            currency_code: 'USD',
            value: plan.amount.toFixed(2),
          },
          custom_id: `${userId}:sub:${planId}`,
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
      const errText = await orderRes.text()
      console.error('PayPal order error:', errText)
      return NextResponse.json(
        { error: 'paypal_error', message: '创建订单失败', details: errText.slice(0, 300) },
        { status: 502 }
      )
    }

    const orderData = await orderRes.json()

    // 保存 pending 订单到 D1
    if (DB && DB.prepare) {
      await DB.prepare(
        "INSERT INTO payments (id, user_id, paypal_order_id, plan_type, amount, status) VALUES (?, ?, ?, ?, 'pending')"
      ).bind(orderData.id, userId, orderData.id, planId, plan.amount).run()
    }

    const approvalUrl = orderData.links?.find((l: any) => l.rel === 'approve')?.href

    if (!approvalUrl) {
      console.error('No approve link found:', JSON.stringify(orderData.links).slice(0, 300))
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
      { error: 'internal_error', message: '服务异常: ' + (error instanceof Error ? error.message : String(error)).slice(0, 200) },
      { status: 500 }
    )
  }
}
