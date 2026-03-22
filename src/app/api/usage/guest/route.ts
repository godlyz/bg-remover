import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET(request: NextRequest) {
  // 游客用户使用本地存储计数，服务端返回默认额度
  return NextResponse.json({ used: 0, total: 3 })
}
