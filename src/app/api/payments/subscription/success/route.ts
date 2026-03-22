import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')
    const ba_token = searchParams.get('ba_token')
    const planType = searchParams.get('planType') || ''

    if (!subscriptionId || !ba_token) {
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
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    // 从 D1 查找 pending 订阅记录获取 userId
    const { DB } = (globalThis as any).cloudflare?.env || {}

    if (DB && DB.prepare) {
      const sub = await DB.prepare(
        "SELECT id, user_id, plan_type, credits_per_month FROM subscriptions WHERE paypal_subscription_id = ?"
      ).bind(subscriptionId).first()

      if (sub) {
        // 更新订阅状态
        await DB.prepare(
          "UPDATE subscriptions SET status = 'active', start_date = datetime('now') WHERE id = ?"
        ).bind(sub.id).run()

        // 更新用户套餐
        const planValue = sub.plan_type === 'monthly_pro' ? 'pro' : 'starter'
        await DB.prepare(
          "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(planValue, sub.user_id).run()

        // 保存支付记录
        const amount = sub.plan_type === 'monthly_pro' ? 19.99 : 9.99
        await DB.prepare(
          "INSERT INTO payments (id, user_id, paypal_subscription_id, plan_type, amount, status, completed_at) VALUES (?, ?, ?, ?, 'completed', datetime('now'))"
        ).bind(`pay_${crypto.randomUUID().replace(/-/g, '')}`, sub.user_id, subscriptionId, sub.plan_type, amount).run()
      }
    }

    return NextResponse.redirect(new URL('/payment?status=success&type=subscription', request.url))
  } catch (error) {
    console.error('Subscription success error:', error)
    return NextResponse.redirect(new URL('/payment?status=failed', request.url))
  }
}
