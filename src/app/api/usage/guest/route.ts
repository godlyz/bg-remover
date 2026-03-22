import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const ua = request.headers.get('user-agent') || ''

  const fingerprint = `${ip}-${ua.slice(0, 50)}`
  const month = new Date().toISOString().slice(0, 7)

  try {
    const KV = await getDB().kv // TODO: getKV not implemented yet
    return NextResponse.json({ used: 0, total: 3 })
  } catch {
    // KV 暂时返回默认值
    return NextResponse.json({ used: 0, total: 3 })
  }
}
