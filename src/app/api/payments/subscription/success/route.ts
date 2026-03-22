import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/?payment=failed', request.url))
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')
    const ba_token = searchParams.get('ba_token')
    const planType = searchParams.get('planType') || ''

    if (!subscriptionId || !ba_token) {
      return NextResponse.redirect(new URL('/?payment=failed&reason=missing_params', request.url))
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.redirect(new URL('/?payment=failed&reason=config', request.url))
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
      return NextResponse.redirect(new URL('/?payment=failed&reason=paypal_token', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Activate subscription
    const actRes = await fetch(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}/activate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason_code: 'CUSTOMER_APPROVAL' }),
      }
    )

    if (!actRes.ok) {
      console.error('Activate subscription failed:', await actRes.text())
      return NextResponse.redirect(new URL('/?payment=failed&reason=activate', request.url))
    }

    // 更新 D1
    const userId = session.user.id
    const { DB } = (globalThis as any).cloudflare?.env || {}

    if (DB && DB.prepare) {
      // 更新订阅状态
      await DB.prepare(
        "UPDATE subscriptions SET status = 'active', start_date = datetime('now') WHERE paypal_subscription_id = ? AND user_id = ?"
      ).bind(subscriptionId, userId).run()

      // 更新用户套餐
      const planValue = planType === 'monthly_pro' ? 'pro' : 'starter'
      await DB.prepare(
        "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(planValue, userId).run()

      // 保存支付记录
      const paymentId = `pay_${crypto.randomUUID().replace(/-/g, '')}`
      const amount = planType === 'monthly_pro' ? 19.99 : 9.99
      await DB.prepare(
        "INSERT INTO payments (id, user_id, paypal_subscription_id, plan_type, amount, status, completed_at) VALUES (?, ?, ?, ?, 'completed', datetime('now'))"
      ).bind(paymentId, userId, subscriptionId, planType, amount).run()
    }

    return NextResponse.redirect(new URL('/?payment=success&type=subscription', request.url))
  } catch (error) {
    console.error('Subscription success error:', error)
    return NextResponse.redirect(new URL('/?payment=failed&reason=error', request.url))
  }
}
