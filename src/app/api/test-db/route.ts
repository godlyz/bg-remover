import { NextRequest, NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET() {
  try {
    const accountId = '3d3880f37301637156fefbf92e495102'
    const apiToken = 'cfat_pX978LoBmJpf9Lu48ylbpeY0VIzQ31HRJ4rj2PvA2c5216bf'
    const dbId = 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: 'SELECT 1 as ok', params: [] }),
      }
    )
    const data = await res.json()
    return NextResponse.json({
      accountId: accountId?.slice(0, 8),
      hasToken: !!apiToken,
      dbId: dbId?.slice(0, 8),
      status: res.status,
      success: data.success,
      result: data.result?.[0]?.results?.[0]?.ok,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'DB error', stack: e.stack?.slice?.(0, 200) }, { status: 500 })
  }
}
