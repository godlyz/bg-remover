import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

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
