import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const planId = searchParams.get('planId') || ''

    if (!token) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    // 获取 PayPal Token
    const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Capture 一次性支付
    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const capture = await captureRes.json()

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('Capture failed:', JSON.stringify(capture).slice(0, 300))
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const paypalOrderId = capture.id
    const customId = capture.purchase_units?.[0]?.custom_id || ''
    const amount = parseFloat(capture.purchase_units?.[0]?.amount?.value || '0')
    const [userId, pType, actualPlanId] = customId.split(':')

    // 更新 D1
    const { DB } = (globalThis as any).cloudflare?.env || {}

    if (DB && DB.prepare && userId) {
      // 更新支付记录状态
      await DB.prepare(
        "UPDATE payments SET status = 'completed', completed_at = datetime('now'), amount = ? WHERE paypal_order_id = ?"
      ).bind(amount, paypalOrderId).run()

      const planValue = actualPlanId === 'monthly_pro' ? 'pro' : 'starter'

      // 更新用户套餐
      await DB.prepare(
        "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(planValue, userId).run()

      // 创建订阅记录（本地管理周期）
      const subId = `sub_${crypto.randomUUID().replace(/-/g, '')}`
      const now = new Date()
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await DB.prepare(
        "INSERT OR REPLACE INTO subscriptions (id, user_id, plan_type, status, credits_per_month, period_start, period_end, start_date) VALUES (?, ?, ?, 'active', ?, ?, ?, datetime('now'))"
      ).bind(subId, userId, actualPlanId, planValue === 'pro' ? 60 : 25, now.toISOString(), periodEnd).run()
    }

    return NextResponse.redirect(new URL('/payment?status=success&type=subscription', request.url))
  } catch (error) {
    console.error('Subscription success error:', error)
    return NextResponse.redirect(new URL('/payment?status=failed', request.url))
  }
}
