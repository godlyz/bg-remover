import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
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

    const { DB } = (globalThis as any).cloudflare?.env || {}
    const userId = session.user.id

    // 查找活跃订阅
    if (!DB || !DB.prepare) {
      return NextResponse.json(
        { error: 'db_unavailable', message: '数据库不可用' },
        { status: 503 }
      )
    }

    const sub = await DB.prepare(
      "SELECT id, paypal_subscription_id, plan_type FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
    ).bind(userId).first()

    if (!sub) {
      return NextResponse.json(
        { error: 'no_subscription', message: '没有活跃的订阅' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'paypal_error', message: '支付服务暂不可用' },
        { status: 502 }
      )
    }

    const { access_token } = await tokenRes.json()

    // 取消 PayPal 订阅
    const cancelRes = await fetch(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${sub.paypal_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Customer cancelled subscription' }),
      }
    )

    if (!cancelRes.ok) {
      console.error('Cancel subscription failed:', await cancelRes.text())
      return NextResponse.json(
        { error: 'paypal_error', message: '取消订阅失败' },
        { status: 502 }
      )
    }

    // 更新 D1（当期有效，下月降为免费）
    await DB.prepare(
      "UPDATE subscriptions SET status = 'cancelled', cancelled_at = datetime('now') WHERE id = ?"
    ).bind(sub.id).run()

    // 用户套餐标记为 free（下月生效），保留当前月权益
    // 这里不立即改 plan，等 webhook 通知到期后再改

    return NextResponse.json({
      success: true,
      message: '订阅已取消，当前月仍可使用，下月将降为免费',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
