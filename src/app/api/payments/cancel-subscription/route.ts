import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

/** D1 REST API */
async function dbQuery(sql: string, params: any[] = []): Promise<any[]> {
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/3d3880f37301637156fefbf92e495102/d1/database/a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef/query`,
    { method: 'POST', headers: { 'Authorization': `Bearer cfat_pX978LoBmJpf9Lu48ylbpeY0VIzQ31HRJ4rj2PvA2c5216bf`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) }
  )
  if (!r.ok) throw new Error(`D1 ${r.status}`)
  const d = await r.json()
  return d.result?.[0]?.results || []
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || ''
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', message: '请先登录' }, { status: 401 })
    }

    await dbQuery(
      "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
      [userId]
    )
    await dbQuery(
      "UPDATE users SET plan = 'free', updated_at = datetime('now') WHERE id = ?",
      [userId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'internal_error', message: '服务异常' }, { status: 500 })
  }
}
