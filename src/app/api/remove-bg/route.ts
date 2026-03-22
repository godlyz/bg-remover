import { NextRequest, NextResponse } from 'next/server'
import { getDB, getKV } from '@/lib/cloudflare'

export const runtime = "edge"

/** 简单 hash */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** API Key 轮换：选本月用量最少的 */
async function selectApiKey(KV: any): Promise<string | null> {
  const keys = process.env.RB_API_KEYS || process.env.REMOVEBG_API_KEY || ''
  const keyList = keys.split(',').map(k => k.trim()).filter(Boolean)

  if (keyList.length === 0) return null
  if (keyList.length === 1) return keyList[0]

  const month = new Date().toISOString().slice(0, 7)

  if (!KV) return keyList[Math.floor(Math.random() * keyList.length)]

  let bestKey = keyList[0]
  let minUsed = Infinity

  for (const key of keyList) {
    const data = await KV.get(`apikey:${key}:${month}`)
    const used = data ? parseInt(data) : 0
    if (used < minUsed) {
      minUsed = used
      bestKey = key
    }
  }

  await KV.put(`apikey:${bestKey}:${month}`, String(minUsed + 1))
  return bestKey
}

/**
 * remove.bg API 代理路由（带用量控制 + API Key 轮换）
 */
export async function POST(request: NextRequest) {
  const DB = await getDB()
  const KV = await getKV()
  const env = { DB, KV }

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
        if (DB && DB.prepare) {
          const user = await DB.prepare(
            "SELECT plan, cloud_used_lifetime, credits, credits_expiry FROM users WHERE id = ?"
          ).bind(userId).first()
          if (user) {
            plan = user.plan as string
            credits = user.credits as number || 0
            creditsExpiry = user.credits_expiry as string | null
            freeUsed = user.cloud_used_lifetime as number || 0

            // 清理过期积分
            if (credits > 0 && creditsExpiry && new Date(creditsExpiry) < new Date()) {
              credits = 0
              creditsExpiry = null
              DB.prepare(
                "UPDATE users SET credits = 0, credits_expiry = NULL, updated_at = datetime('now') WHERE id = ?"
              ).bind(userId).run()
            }

            // 月订阅用量（按订阅周期 30 天计算）
            if (plan !== 'free') {
              const sub = await DB.prepare(
                "SELECT id, credits_per_month, period_start, period_end FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
              ).bind(userId).first()
              if (sub) {
                subTotal = sub.credits_per_month as number || 0
                const periodStart = sub.period_start as string
                const periodEnd = sub.period_end as string

                // 如果周期已过，自动续期
                if (periodEnd && new Date(periodEnd) < new Date()) {
                  const newStart = periodEnd
                  const newEnd = new Date(new Date(newStart).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
                  await DB.prepare(
                    "UPDATE subscriptions SET period_start = ?, period_end = ? WHERE id = ?"
                  ).bind(newStart, newEnd, sub.id).run()
                  subUsed = 0
                } else if (periodStart && periodEnd) {
                  // 当前周期内的用量
                  const row = await DB.prepare(
                    "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
                  ).bind(userId, periodStart.slice(0, 7)).first()
                  subUsed = row ? (row.cloud_used as number) : 0
                }
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
  const fingerprint = await hashString(
    `${request.headers.get('cf-connecting-ip') || 'unknown'}:${request.headers.get('user-agent') || ''}`
  )

  if (userType === 'guest') {
    return NextResponse.json(
      { error: 'quota_exceeded', type: 'guest', plan, used: 0, total: 0, message: '注册后可使用云端处理' },
      { status: 402 }
    )
  }

  if (userType === '') {
    // 全部用完
    return NextResponse.json(
      { error: 'quota_exceeded', type: 'exhausted', plan, used: 0, total: 0, message: '所有额度已用完，请购买积分或订阅' },
      { status: 402 }
    )
  }

  let currentUsage = 0
  let maxUsage = 0

  if (userType === 'credits') {
    maxUsage = credits
    currentUsage = 0
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

  // --- 3. API Key 轮换 ---
  const apiKey = await selectApiKey(KV)
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
    if (userType === 'credits' && DB && DB.prepare && userId) {
      await DB.prepare(
        "UPDATE users SET credits = credits - 1, updated_at = datetime('now') WHERE id = ?"
      ).bind(userId).run()
    } else if (userType === 'free' && DB && DB.prepare && userId) {
      await DB.prepare(
        "UPDATE users SET cloud_used_lifetime = cloud_used_lifetime + 1, updated_at = datetime('now') WHERE id = ?"
      ).bind(userId).run()
    } else if (userType === 'paid' && DB && DB.prepare && userId) {
      // 按订阅周期记录用量
      const sub = await DB.prepare(
        "SELECT period_start FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
      ).bind(userId).first()
      const periodKey = (sub?.period_start || new Date().toISOString()).slice(0, 7)
      const existing = await DB.prepare(
        "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
      ).bind(userId, periodKey).first()
      if (existing) {
        await DB.prepare(
          "UPDATE usage SET cloud_used = cloud_used + 1 WHERE user_id = ? AND month = ?"
        ).bind(userId, periodKey).run()
      } else {
        await DB.prepare(
          "INSERT INTO usage (user_id, month, cloud_used, plan) VALUES (?, ?, 1, ?)"
        ).bind(userId, periodKey, plan).run()
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
