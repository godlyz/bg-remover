import { NextResponse } from 'next/server'

export const runtime = "edge"

export async function GET() {
  try {
    const accountId = '3d3880f37301637156fefbf92e495102'
    const apiToken = 'cfat_pX978LoBmJpf9Lu48ylbpeY0VIzQ31HRJ4rj2PvA2c5216bf'
    const dbId = 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`
    const body = JSON.stringify({ sql: 'SELECT 1 as ok', params: [] })
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body,
    })
    
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { text } }
    
    return NextResponse.json({
      accountId: accountId?.slice(0, 8),
      hasToken: !!apiToken,
      tokenFirstChars: apiToken?.slice(0, 8),
      dbId: dbId?.slice(0, 8),
      status: res.status,
      ok: res.ok,
      responseText: text?.slice(0, 300),
      parsed: data,
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message || 'error', 
      name: e.name, 
      stack: e.stack?.slice?.(0, 300) 
    }, { status: 500 })
  }
}
