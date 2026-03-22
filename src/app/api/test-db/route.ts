import { NextResponse } from 'next/server'
import { getCloudflareEnv } from '@/lib/cloudflare'

export const runtime = "edge"

export async function GET() {
  try {
    const env = getCloudflareEnv()
    const DB = env?.DB
    return NextResponse.json({
      hasEnv: !!env,
      hasDB: !!DB,
      hasPrepare: DB?.prepare ? true : false,
      envKeys: env ? Object.keys(env) : [],
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 300) }, { status: 500 })
  }
}
