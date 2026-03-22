import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', message: '请先登录' }, { status: 401 })
    }

    const db = getDB()
    const users = await db.query("SELECT plan, credits, credits_expiry, cloud_used_lifetime FROM users WHERE id = ?", [userId])

    let plan = 'free', credits = 0, creditsExpiry: string | null = null, freeUsed = 0
    if (users.length > 0) {
      const user = users[0]
      plan = user.plan || 'free'
      credits = user.credits || 0
      creditsExpiry = user.credits_expiry
      freeUsed = user.cloud_used_lifetime || 0
    }

    // 清理过期积分
    if (credits > 0 && creditsExpiry && new Date(creditsExpiry) < new Date()) {
      credits = 0
    }

    let subUsed = 0, subTotal = 0, subscription = null

    if (plan !== 'free') {
      const subs = await db.query(
        "SELECT id, plan_type, credits_per_month, period_start, period_end FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
        [userId]
      )
      if (subs.length > 0) {
        const sub = subs[0]
        subscription = {
          planType: sub.plan_type,
          status: sub.status,
          creditsPerMonth: sub.credits_per_month,
          periodEnd: sub.period_end,
        }
        subTotal = sub.credits_per_month || 0

        if (sub.period_end && new Date(sub.period_end) < new Date()) {
          const newStart = sub.period_end
          const newEnd = new Date(new Date(newStart).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          await db.run("UPDATE subscriptions SET period_start = ?, period_end = ? WHERE id = ?", [newStart, newEnd, sub.id])
          subTotal = sub.credits_per_month
          subUsed = 0
        } else {
          const periodKey = (sub.period_start || '').slice(0, 7)
          const rows = await db.query("SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?", [userId, periodKey])
          subUsed = rows.length > 0 ? (rows[0].cloud_used || 0) : 0
        }
      }
    }

    return NextResponse.json({ plan, credits, creditsExpiry, freeUsed, subUsed, subTotal, subscription })
  } catch (error) {
    console.error('Account API error:', error)
    return NextResponse.json({ error: 'internal_error', message: '服务异常' }, { status: 500 })
  }
}
