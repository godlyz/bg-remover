import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

const getDB = () => process.env.DB as any
const dbQuery = async (sql: string, params: any[] = []) => {
  return (await getDB().prepare(sql).bind(...params).all()).results
}
const dbFirst = async (sql: string, params: any[] = []) => {
  return (await getDB().prepare(sql).bind(...params).first())
}
const dbRun = async (sql: string, params: any[] = []) => {
  await getDB().prepare(sql).bind(...params).run()
}


const PLAN_CONFIG: Record<string, { credits?: number }> = {
  credits_10: { credits: 10 },
  credits_30: { credits: 30 },
  credits_80: { credits: 80 },
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
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const capture = await captureRes.json()

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', JSON.stringify(capture).slice(0, 300))
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    const paypalOrderId = capture.id
    const amount = parseFloat(capture.purchase_units?.[0]?.amount?.value || '0')
    const customId = capture.purchase_units?.[0]?.custom_id || ''
    const [userId] = customId.split(':')

    if (!userId) {
      return NextResponse.redirect(new URL('/payment?status=failed', request.url))
    }

    // 通过 Cloudflare REST API 写入 D1

    // 确保用户存在
    await dbQuery(
      "INSERT OR IGNORE INTO users (id, google_id, plan, cloud_used_lifetime) VALUES (?, ?, 'free', 0)",
      [userId, userId]
    )

    // 保存支付记录
    const payId = `pay_${crypto.randomUUID().replace(/-/g, '')}`
    await dbQuery(
      "INSERT INTO payments (id, user_id, paypal_order_id, plan_type, amount, status, completed_at) VALUES (?, ?, ?, ?, 'completed', datetime('now'))",
      [payId, userId, paypalOrderId, planId, amount]
    )

    // 积分包：增加积分
    const plan = PLAN_CONFIG[planId]
    if (planType === 'credit' && plan?.credits) {
      await dbQuery(
        "UPDATE users SET credits = credits + ?, credits_expiry = datetime('now', '+365 days'), updated_at = datetime('now') WHERE id = ?",
        [plan.credits, userId]
      )
    }

    return NextResponse.redirect(new URL(`/payment?status=success&type=credit`, request.url))
  } catch (error) {
    console.error('Payment confirm error:', error)
    return NextResponse.redirect(new URL('/payment?status=failed', request.url))
  }
}
