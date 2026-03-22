import { NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET() {
  // 测试环境变量是否可读
  return NextResponse.json({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'HAS_VALUE' : 'UNDEFINED',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'HAS_VALUE' : 'UNDEFINED',
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || 'UNDEFINED',
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'UNDEFINED',
    D1_DATABASE_ID: process.env.D1_DATABASE_ID || 'UNDEFINED',
    // 硬编码验证
    hardcoded_ok: 'YES',
  })
}
