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
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const email = body.email || ''
    const name = body.name || ''
    const image = body.image || ''


    // 先检查是否已存在
    const existing = await dbQuery("SELECT id FROM users WHERE id = ?", [userId])
    if (!existing || existing.length === 0) {
      // 新用户，创建记录
      await dbQuery(
        "INSERT INTO users (id, google_id, email, name, avatar_url, plan, cloud_used_lifetime) VALUES (?, ?, ?, ?, ?, 'free', 0)",
        [userId, userId, email, name, image]
      )
    } else {
      // 已存在，更新信息
      await dbQuery(
        "UPDATE users SET email = COALESCE(NULLIF(email, ''), ?), name = COALESCE(NULLIF(name, ''), ?), avatar_url = COALESCE(NULLIF(avatar_url, ''), ?), updated_at = datetime('now') WHERE id = ?",
        [email, name, image, userId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Ensure user error:', error)
    return NextResponse.json({ error: error.message || '写入失败' }, { status: 500 })
  }
}
