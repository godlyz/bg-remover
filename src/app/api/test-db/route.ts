import { NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare'

export const runtime = "edge"

export async function GET() {
  try {
    // 直接测试 D1 REST API
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ''
    const apiToken = process.env.CLOUDFLARE_API_TOKEN || ''
    const dbId = process.env.D1_DATABASE_ID || 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'

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
    return NextResponse.json({ accountId: accountId ? accountId.slice(0, 8) + '...' : 'EMPTY', dbId: dbId.slice(0, 8) + '...', status: res.status, result: data.success })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
