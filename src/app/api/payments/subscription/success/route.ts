import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

const PLAN_CONFIG: Record<string, { creditsPerMonth: number; planValue: string }> = {
  monthly_basic: { creditsPerMonth: 25, planValue: 'starter' },
  monthly_pro: { creditsPerMonth: 60, planValue: 'pro' },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
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
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    })

    const capture = await captureRes.json()

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('Capture failed:', JSON.stringify(capture).slice(0, 300))
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const paypalOrderId = capture.id
    const amount = parseFloat(capture.purchase_units?.[0]?.amount?.value || '0')
    const customId = capture.purchase_units?.[0]?.custom_id || ''
    const parts = customId.split(':')
    const userId = parts[0]
    const actualPlanId = parts.slice(2).join(':')

    if (!userId) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const db = getDB()

    // 确保用户存在
    await db.run(
      "INSERT OR IGNORE INTO users (id, google_id, plan, cloud_used_lifetime) VALUES (?, ?, 'free', 0)",
      [userId, userId]
    )

    // 保存支付记录
    const payId = `pay_${crypto.randomUUID().replace(/-/g, '')}`
    await db.run(
      "INSERT INTO payments (id, user_id, paypal_order_id, plan_type, amount, status, completed_at) VALUES (?, ?, ?, ?, 'completed', datetime('now'))",
      [payId, userId, paypalOrderId, actualPlanId, amount]
    )

    // 更新用户套餐
    const plan = PLAN_CONFIG[actualPlanId]
    if (plan) {
      await db.run(
        "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?",
        [plan.planValue, userId]
      )

      // 创建订阅记录
      const subId = `sub_${crypto.randomUUID().replace(/-/g, '')}`
      const now = new Date().toISOString()
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await db.run(
        "INSERT INTO subscriptions (id, user_id, plan_type, status, credits_per_month, period_start, period_end, start_date) VALUES (?, ?, ?, 'active', ?, ?, ?, datetime('now'))",
        [subId, userId, actualPlanId, plan.creditsPerMonth, now, periodEnd]
      )
    }

    const type = plan ? 'subscription' : 'credit'
    return NextResponse.redirect(new URL(`/payment?status=success&type=${type}`, request.url))
  } catch (error) {
    console.error('Subscription success error:', error)
    return NextResponse.redirect(new URL('/payment?status=failed', request.url))
  }
}
