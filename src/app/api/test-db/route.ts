import { NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

export async function GET() {
  try {
    const db = getDB()
    const r = await db.query('SELECT 1 as ok')
    return NextResponse.json({
      ok: r.length > 0 && r[0]?.ok === 1,
      results: r,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error', stack: e.stack?.slice?.(0, 200) }, { status: 500 })
  }
}
