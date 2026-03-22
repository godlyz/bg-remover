import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    // 用 auth() 获取 session（从 cookie 读取 JWT）
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { DB } = (globalThis as any).cloudflare?.env || {}

    if (DB && DB.prepare) {
      const user = await DB.prepare(
        "SELECT id, email, name, avatar_url, plan, cloud_used_lifetime, created_at FROM users WHERE id = ?"
      ).bind(userId).first()

      if (!user) {
        return NextResponse.json(
          { error: 'user_not_found', message: '用户不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        plan: user.plan,
        createdAt: user.created_at,
      })
    }

    // D1 不可用时，返回 session 中的基本信息
    return NextResponse.json({
      id: userId,
      email: session.user.email,
      name: session.user.name,
      avatarUrl: session.user.image,
      plan: 'free',
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Account API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
