import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

export async function GET() {
  try {
    const db = getDB()
    return NextResponse.json({
      hasDB: !!db,
      test: await db.query("SELECT 1 as test", []),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 300) }, { status: 500 })
  }
}
