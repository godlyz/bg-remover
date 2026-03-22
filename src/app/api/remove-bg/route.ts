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

/** D1 REST API 查询 */

/** 简单 hash */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** API Key 轮换 */
async function selectApiKey(): Promise<string | null> {
  const keys = process.env.RB_API_KEYS || process.env.REMOVEBG_API_KEY || ''
  const keyList = keys.split(',').map(k => k.trim()).filter(Boolean)
  if (keyList.length === 0) return null
  return keyList[Math.floor(Math.random() * keyList.length)]
}

/**
 * remove.bg API 代理路由（带用量控制）
 */
export async function POST(request: NextRequest) {
  // --- 1. 身份识别 ---
  let userId: string | null = null
  let userType = 'guest'
  let plan = 'free'
  let credits = 0
  let creditsExpiry: string | null = null
  let subUsed = 0
  let subTotal = 0
  let freeUsed = 0

  const authSession = request.headers.get('x-auth-session')
  if (authSession) {
    try {
      const session = JSON.parse(authSession)
      if (session?.user?.id) {
        userId = session.user.id
        const users = await dbQuery(
          "SELECT plan, cloud_used_lifetime, credits, credits_expiry FROM users WHERE id = ?",
          [userId]
        )
        const user = users.results?.[0]
        if (user) {
          plan = user.plan || 'free'
          credits = user.credits || 0
          creditsExpiry = user.credits_expiry || null
          freeUsed = user.cloud_used_lifetime || 0

          // 清理过期积分
          if (credits > 0 && creditsExpiry && new Date(creditsExpiry) < new Date()) {
            credits = 0
            creditsExpiry = null
            await dbQuery(
              "UPDATE users SET credits = 0, credits_expiry = NULL, updated_at = datetime('now') WHERE id = ?",
              [userId]
            )
          }

          // 月订阅用量
          if (plan !== 'free') {
            const subs = await dbQuery(
              "SELECT id, credits_per_month, period_start, period_end FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
              [userId]
            )
            const sub = subs.results?.[0]
            if (sub) {
              subTotal = sub.credits_per_month || 0
              const periodStart = sub.period_start
              const periodEnd = sub.period_end

              // 自动续期
              if (periodEnd && new Date(periodEnd) < new Date()) {
                const newStart = periodEnd
                const newEnd = new Date(new Date(newStart).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
                await dbQuery(
                  "UPDATE subscriptions SET period_start = ?, period_end = ? WHERE id = ?",
                  [newStart, newEnd, sub.id]
                )
                subUsed = 0
              } else if (periodStart && periodEnd) {
                const usageRows = await dbQuery(
                  "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?",
                  [userId, periodStart.slice(0, 7)]
                )
                subUsed = usageRows.results?.[0]?.cloud_used || 0
              }
            }
          }
        }
      }
    } catch { /* ignore */ }
  }

  // 先到期先用
  if (credits > 0 && creditsExpiry) {
    userType = 'credits'
  } else if (subUsed < subTotal) {
    userType = 'paid'
  } else if (freeUsed < 3) {
    userType = 'free'
  }

  // --- 2. 计算用量和额度 ---
  if (userType === 'guest') {
    return NextResponse.json(
      { error: 'quota_exceeded', type: 'guest', plan, used: 0, total: 0, message: '注册后可使用云端处理' },
      { status: 402 }
    )
  }

  if (userType === '') {
    return NextResponse.json(
      { error: 'quota_exceeded', type: 'exhausted', plan, used: 0, total: 0, message: '所有额度已用完，请购买积分或订阅' },
      { status: 402 }
    )
  }

  let currentUsage = 0
  let maxUsage = 0

  if (userType === 'credits') {
    maxUsage = credits
  } else if (userType === 'paid') {
    currentUsage = subUsed
    maxUsage = subTotal
  } else {
    currentUsage = freeUsed
    maxUsage = 3
  }

  if (currentUsage >= maxUsage) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        type: userType,
        plan,
        used: currentUsage,
        total: maxUsage,
        message: userType === 'free'
          ? '免费试用已用完，购买积分或订阅继续使用'
          : '本月额度已用完',
      },
      { status: 402 }
    )
  }

  // --- 3. API Key ---
  const apiKey = await selectApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'api_key_missing', message: 'API Key 未配置' },
      { status: 500 }
    )
  }

  // --- 4. 调用 remove.bg API ---
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image_file')

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: 'invalid_input', message: '缺少图片文件' },
        { status: 400 }
      )
    }

    // 扣减用量
    if (userType === 'credits' && userId) {
      await dbQuery(
        "UPDATE users SET credits = credits - 1, updated_at = datetime('now') WHERE id = ?",
        [userId]
      )
    } else if (userType === 'free' && userId) {
      await dbQuery(
        "UPDATE users SET cloud_used_lifetime = cloud_used_lifetime + 1, updated_at = datetime('now') WHERE id = ?",
        [userId]
      )
    } else if (userType === 'paid' && userId) {
      const subs = await dbQuery(
        "SELECT period_start FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
        [userId]
      )
      const sub = subs.results?.[0]
      const periodKey = (sub?.period_start || new Date().toISOString()).slice(0, 7)
      const existing = await dbQuery(
        "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?",
        [userId, periodKey]
      )
      if (existing.results?.[0]) {
        await dbQuery(
          "UPDATE usage SET cloud_used = cloud_used + 1 WHERE user_id = ? AND month = ?",
          [userId, periodKey]
        )
      } else {
        await dbQuery(
          "INSERT INTO usage (user_id, month, cloud_used, plan) VALUES (?, ?, 1, ?)",
          [userId, periodKey, plan]
        )
      }
    }

    // 构建 API 请求
    const apiFormData = new FormData()
    apiFormData.append('image_file', imageFile)
    apiFormData.append('size', 'auto')

    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: apiFormData,
    })

    if (!apiResponse.ok) {
      if (apiResponse.status === 402) {
        return NextResponse.json(
          { error: 'api_quota_exceeded', message: '云端服务额度已用完，请稍后重试' },
          { status: 429 }
        )
      }
      const errorData = await apiResponse.json().catch(() => ({}))
      const message = (errorData as any)?.errors?.[0]?.title || '云端处理失败'
      return NextResponse.json(
        { error: 'api_error', message },
        { status: apiResponse.status }
      )
    }

    const resultBlob = await apiResponse.blob()
    return new NextResponse(resultBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'X-Engine': 'removebg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('remove-bg API error:', error)
    return NextResponse.json(
      { error: 'internal_error', message: '服务异常，请稍后重试' },
      { status: 500 }
    )
  }
}
