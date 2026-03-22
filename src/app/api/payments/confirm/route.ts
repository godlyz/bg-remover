import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

const PLAN_CONFIG: Record<string, { credits?: number; creditsPerMonth?: number }> = {
  credits_10: { credits: 10 },
  credits_30: { credits: 30 },
  credits_80: { credits: 80 },
  monthly_basic: { creditsPerMonth: 25 },
  monthly_pro: { creditsPerMonth: 60 },
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/?payment=failed', request.url))
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const planId = searchParams.get('planId') || ''
    const planType = searchParams.get('planType') || ''

    if (!token) {
      return NextResponse.redirect(new URL('/?payment=failed', request.url))
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.redirect(new URL('/?payment=failed&reason=config', request.url))
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
      return NextResponse.redirect(new URL('/?payment=failed&reason=paypal_token', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Capture 支付
    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const capture = await captureRes.json()

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', capture)
      return NextResponse.redirect(new URL('/?payment=failed&reason=capture', request.url))
    }

    const paypalOrderId = capture.id
    const amount = parseFloat(capture.purchase_units?.[0]?.amount?.value || '0')
    const userId = session.user.id

    // 更新 D1
    const { DB } = (globalThis as any).cloudflare?.env || {}

    if (DB && DB.prepare) {
      // 更新订单状态
      await DB.prepare(
        "UPDATE payments SET status = 'completed', completed_at = datetime('now'), amount = ? WHERE paypal_order_id = ?"
      ).bind(amount, paypalOrderId).run()

      const plan = PLAN_CONFIG[planId]

      if (planType === 'credit' && plan?.credits) {
        // 积分包：增加用户积分
        await DB.prepare(
          "UPDATE users SET credits = credits + ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(plan.credits, userId).run()
      } else if (planType === 'subscription' && plan?.creditsPerMonth) {
        // 月订阅：更新用户套餐
        const planValue = planId === 'monthly_pro' ? 'pro' : 'starter'
        await DB.prepare(
          "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(planValue, userId).run()

        // 创建订阅记录
        const subId = `sub_${crypto.randomUUID().replace(/-/g, '')}`
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        await DB.prepare(
          "INSERT OR REPLACE INTO subscriptions (id, user_id, plan_type, status, credits_per_month, start_date, end_date) VALUES (?, ?, ?, 'active', ?, datetime('now'), ?)"
        ).bind(subId, userId, planId, plan.creditsPerMonth, nextMonth.toISOString()).run()
      }
    }

    return NextResponse.redirect(new URL('/?payment=success', request.url))
  } catch (error) {
    console.error('Payment confirm error:', error)
    return NextResponse.redirect(new URL('/?payment=failed&reason=error', request.url))
  }
}
