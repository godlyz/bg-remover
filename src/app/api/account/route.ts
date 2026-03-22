import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

/**
 * 用户信息 API
 * GET /api/account
 * 返回: { id, email, name, avatarUrl, plan, createdAt }
 */
export async function GET(request: NextRequest) {
  const { DB } = (globalThis as any).cloudflare?.env || {}

  const authSession = request.headers.get('x-auth-session')
  if (!authSession) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const session = JSON.parse(authSession)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    if (!DB || !DB.prepare) {
      return NextResponse.json({ error: 'db_unavailable' }, { status: 500 })
    }

    const user = await DB.prepare(
      "SELECT id, email, name, avatar_url as avatarUrl, plan, cloud_used_lifetime, created_at as createdAt FROM users WHERE id = ?"
    ).bind(userId).first()

    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      cloudUsedLifetime: user.cloud_used_lifetime,
      createdAt: user.createdAt,
    })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
