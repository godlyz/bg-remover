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


export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', used: 0, total: 0, plan: 'free', credits: 0 }, { status: 401 })
    }

    const users = await dbQuery("SELECT plan, credits, credits_expiry, cloud_used_lifetime FROM users WHERE id = ?", [userId])

    let plan = 'free', credits = 0, creditsExpiry = '', freeUsed = 0
    if (users.length > 0) {
      const user = users[0]
      plan = user.plan || 'free'
      credits = user.credits || 0
      creditsExpiry = user.credits_expiry || ''
      freeUsed = user.cloud_used_lifetime || 0
    }

    if (credits > 0 && creditsExpiry && new Date(creditsExpiry) < new Date()) {
      credits = 0
    }

    let subUsed = 0, subTotal = 0
    if (plan !== 'free') {
      const subs = await dbQuery(
        "SELECT id, plan_type, credits_per_month, period_start, period_end FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
        [userId]
      )
      if (subs.length > 0) {
        const sub = subs[0]
        subTotal = sub.credits_per_month || 0
        if (sub.period_end && new Date(sub.period_end) < new Date()) {
          subUsed = 0
        } else {
          const periodKey = (sub.period_start || '').slice(0, 7)
          const rows = await dbQuery("SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?", [userId, periodKey])
          subUsed = rows.length > 0 ? (rows[0].cloud_used || 0) : 0
        }
      }
    }

    return NextResponse.json({ plan, credits, creditsExpiry, used: freeUsed, total: 3, subUsed, subTotal })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({ error: 'internal_error', used: 0, total: 0, plan: 'free', credits: 0 }, { status: 500 })
  }
}
