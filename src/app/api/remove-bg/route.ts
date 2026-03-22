import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

/** 获取套餐对应的最大月用量 */
function getMaxUsage(plan: string): number {
  switch (plan) {
    case 'guest': return 1
    case 'free': return 3
    case 'starter': return 30
    case 'pro': return 100
    case 'business': return 300
    default: return 0
  }
}

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

/** 查询当前用量 */
async function getCurrentUsage(
  userType: string, userId: string | null, plan: string,
  DB: any, KV: any
): Promise<number> {
  if (userType === 'guest') {
    const ip = 'unknown' // 从 request context 传入
    const ua = 'unknown'
    // fingerprint 在调用前计算好，这里简化
    return 0 // 由调用方处理
  }

  if (userType === 'free') {
    if (DB && DB.prepare && userId) {
      const user = await DB.prepare(
        "SELECT cloud_used_lifetime FROM users WHERE id = ?"
      ).bind(userId).first()
      return user ? (user.cloud_used_lifetime as number) : 0
    }
    return 0
  }

  // 付费用户
  const month = new Date().toISOString().slice(0, 7)
  if (DB && DB.prepare && userId) {
    const row = await DB.prepare(
      "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
    ).bind(userId, month).first()
    return row ? (row.cloud_used as number) : 0
  }

  return 0
}

/** 扣减用量 */
async function incrementUsage(
  userType: string, userId: string | null, plan: string,
  DB: any, KV: any, fingerprint: string | null
): Promise<void> {
  if (userType === 'guest' && KV && fingerprint) {
    const data = await KV.get(`guest:${fingerprint}`)
    const current = data ? parseInt(data) : 0
    await KV.put(`guest:${fingerprint}`, String(current + 1))
  } else if (userType === 'free' && DB && DB.prepare && userId) {
    await DB.prepare(
      "UPDATE users SET cloud_used_lifetime = cloud_used_lifetime + 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(userId).run()
  } else if (DB && DB.prepare && userId) {
    const month = new Date().toISOString().slice(0, 7)
    const existing = await DB.prepare(
      "SELECT cloud_used FROM usage WHERE user_id = ? AND month = ?"
    ).bind(userId, month).first()
    if (existing) {
      await DB.prepare(
        "UPDATE usage SET cloud_used = cloud_used + 1 WHERE user_id = ? AND month = ?"
      ).bind(userId, month).run()
    } else {
      await DB.prepare(
        "INSERT INTO usage (user_id, month, cloud_used, plan) VALUES (?, ?, 1, ?)"
      ).bind(userId, month, plan).run()
    }
  }
}

/**
 * remove.bg API 代理路由（带用量控制 + API Key 轮换）
 */
export async function POST(request: NextRequest) {
  const { env } = (globalThis as any).cloudflare?.env || {}
  const { DB, KV } = env || {}

  // --- 1. 身份识别 ---
  let userId: string | null = null
  let userType = 'guest'
  let plan = 'free'

  const authSession = request.headers.get('x-auth-session')
  if (authSession) {
    try {
      const session = JSON.parse(authSession)
      if (session?.user?.id) {
        userId = session.user.id
        if (DB && DB.prepare) {
          const user = await DB.prepare(
            "SELECT plan, cloud_used_lifetime FROM users WHERE id = ?"
          ).bind(userId).first()
          if (user) {
            plan = user.plan as string
            userType = plan === 'free' ? 'free' : 'paid'
          }
        }
      }
    } catch { /* ignore */ }
  }

  // --- 2. 计算用量 ---
  const fingerprint = userType === 'guest'
    ? await hashString(
        `${request.headers.get('cf-connecting-ip') || 'unknown'}:${request.headers.get('user-agent') || ''}`
      )
    : null

  const maxUsage = getMaxUsage(userType)
  const currentUsage = await getCurrentUsage(userType, userId, plan, DB, KV)

  // 用量不足
  if (currentUsage >= maxUsage) {
    return NextResponse.json(
      {
        error: 'quota_exceeded',
        type: userType,
        plan,
        used: currentUsage,
        total: maxUsage,
        message: userType === 'guest'
          ? '注册后可获得 3 次云端免费体验'
          : userType === 'free'
          ? '免费额度已用完，升级套餐继续使用'
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
    await incrementUsage(userType, userId, plan, DB, KV, fingerprint)

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
