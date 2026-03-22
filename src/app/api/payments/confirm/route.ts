import { getCloudflareEnv } from '@/lib/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

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
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const planId = searchParams.get('planId') || ''
    const planType = searchParams.get('planType') || ''

    if (!token) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
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
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // Capture 支付
    const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
    })

    const capture = await captureRes.json()

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', capture)
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const paypalOrderId = capture.id
    const amount = parseFloat(capture.purchase_units?.[0]?.amount?.value || '0')

    // 从 custom_id 获取 userId（创建订单时传入的）
    const customId = capture.purchase_units?.[0]?.custom_id || ''
    const [userId] = customId.split(':')

    if (!userId) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    // 更新 D1
    const env = getCloudflareEnv(); const DB = env.DB

    if (DB && DB.prepare) {
      // 确保用户存在（懒创建）
      await DB.prepare(
        "INSERT OR IGNORE INTO users (id, google_id, plan, cloud_used_lifetime) VALUES (?, ?, 'free', 0)"
      ).bind(userId, userId).run()

      // 保存支付记录
      await DB.prepare(
        "INSERT INTO payments (id, user_id, paypal_order_id, plan_type, amount, status, completed_at) VALUES (?, ?, ?, ?, 'completed', datetime('now'))"
      ).bind(`pay_${crypto.randomUUID().replace(/-/g, '')}`, userId, paypalOrderId, planId, amount).run()

      const plan = PLAN_CONFIG[planId]

      if (planType === 'credit' && plan?.credits) {
        // 积分包：增加积分，365 天过期
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 365)
        const currentExpiry = await DB.prepare(
          "SELECT credits_expiry FROM users WHERE id = ?"
        ).bind(userId).first()
        // 取当前过期时间和新过期时间的较晚值
        const newExpiry = (!currentExpiry?.credits_expiry || new Date(currentExpiry.credits_expiry) < new Date())
          ? expiry.toISOString()
          : currentExpiry.credits_expiry

        await DB.prepare(
          "UPDATE users SET credits = credits + ?, credits_expiry = ?, updated_at = datetime('now') WHERE id = ?"
        ).bind(plan.credits, newExpiry, userId).run()
      }
    }

    return NextResponse.redirect(new URL(`/payment?status=success&type=credit`, request.url))
  } catch (error) {
    console.error('Payment confirm error:', error)
    return NextResponse.redirect(new URL('/payment?status=failed', request.url))
  }
}
