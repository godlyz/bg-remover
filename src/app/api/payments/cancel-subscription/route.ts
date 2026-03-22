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
