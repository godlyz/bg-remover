import { NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET() {
  try {
    const DB = process.env.DB as any
    const { results } = await DB.prepare('SELECT 1 as ok').all()
    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error', stack: e.stack?.slice?.(0, 200) }, { status: 500 })
  }
}
