import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '请先登录' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { DB } = (globalThis as any).cloudflare?.env || {}

    if (!DB || !DB.prepare) {
      // D1 不可用时返回 session 基本信息
      return NextResponse.json({
        id: userId,
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.image,
        plan: 'free',
        createdAt: new Date().toISOString(),
        credits: 0,
        subscription: null,
      })
    }

    const user = await DB.prepare(
      "SELECT id, email, name, avatar_url, plan, cloud_used_lifetime, credits, credits_expiry, created_at FROM users WHERE id = ?"
    ).bind(userId).first()

    if (!user) {
      return NextResponse.json(
        { error: 'user_not_found', message: '用户不存在' },
        { status: 404 }
      )
    }

    // 查询活跃订阅
    let subscription = null
    const sub = await DB.prepare(
      "SELECT id, plan_type, status, credits_per_month, start_date, end_date, created_at FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
    ).bind(userId).first()

    if (sub) {
      subscription = {
        planType: sub.plan_type,
        status: sub.status,
        creditsPerMonth: sub.credits_per_month,
        startDate: sub.start_date,
        periodEnd: sub.period_end,
        createdAt: sub.created_at,
      }
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      plan: user.plan,
      createdAt: user.created_at,
      credits: user.credits || 0,
      creditsExpiry: user.credits_expiry,
      subscription,
    })
  } catch (error) {
    console.error('Account API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常' },
      { status: 500 }
    )
  }
}
