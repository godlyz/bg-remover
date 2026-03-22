import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

/**
 * 未登录访客用量查询
 * GET /api/usage/guest
 * 通过 IP+UA fingerprint 识别
 */
export async function GET(request: NextRequest) {
  const { KV } = (globalThis as any).cloudflare?.env || {}

  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const ua = request.headers.get('user-agent') || ''

  const fingerprint = await hashString(`${ip}:${ua}`)

  let used = 0
  if (KV) {
    const data = await KV.get(`guest:${fingerprint}`)
    used = data ? parseInt(data) : 0
  }

  return NextResponse.json({
    used,
    total: 1,
    type: 'guest',
  })
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
