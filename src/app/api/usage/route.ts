import { getCloudflareEnv } from '@/lib/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''

    if (!userId) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录', used: 0, total: 0, plan: 'free', credits: 0 },
        { status: 401 }
      )
    }

    const env = getCloudflareEnv(); const DB = env.DB

    let plan = 'free'
    let credits = 0
    let creditsExpiry = null
    let freeUsed = 0
    let subUsed = 0
    let subTotal = 0

    if (DB && DB.prepare) {
      const user = await DB.prepare(
        "SELECT plan, credits, credits_expiry, cloud_used_lifetime FROM users WHERE id = ?"
      ).bind(userId).first()

      if (user) {
        plan = user.plan as string
        credits = user.credits as number || 0
        creditsExpiry = user.credits_expiry as string | null
        freeUsed = user.cloud_used_lifetime as number || 0

        if (credits > 0 && creditsExpiry && new Date(creditsExpiry) < new Date()) {
          credits = 0
        }
      }

      if (plan !== 'free') {
        const sub = await DB.prepare(
          "SELECT id, plan_type, credits_per_month, period_start, period_end FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
        ).bind(userId).first()

        if (sub) {
          subscription = {
            planType: sub.plan_type,
            status: sub.status,
            creditsPerMonth: sub.credits_per_month,
            periodEnd: sub.period_end,
          }
          subTotal = sub.credits_per_month as number || 0

          if (sub.periodEnd && new Date(sub.periodEnd) < new Date()) {
            const newStart = sub.periodEnd
            const newEnd = new Date(new Date(newStart).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
            await DB.prepare(
              "UPDATE subscriptions SET period_start = ?, period_end = ? WHERE id = ?"
            ).bind(newStart, newEnd, sub.id).run()
            subUsed = 0
          } else {
            const periodKey = (sub.period_start || '').slice(0, 7)
            const row = await DB.prepare(
              "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
            ).bind(userId, periodKey).first()
            subUsed = row ? (row.cloud_used as number) : 0
          }
        }
      }
    }

    return NextResponse.json({ plan, credits, creditsExpiry, used: freeUsed, total: 3, subUsed, subTotal })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常', used: 0, total: 0, plan: 'free', credits: 0 },
      { status: 500 }
    )
  }
}
