/**
 * Cloudflare D1 HTTP API 客户体
 * 
 * 通过 Cloudflare REST API 操作 D1 数据库
 * 环境变量和硬编码值都尝试
 */

const FALLBACK_ACCOUNT = '3d3880f37301637156fefbf92e495102'
const FALLBACK_TOKEN = 'cfat_WH7R0GNa6c8vNMUiG1GB1pDUIRNvCBmZpV1ZLcJF0796ffee'
const FALLBACK_DB_ID = 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'

function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback
}

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  const accountId = getEnv('CLOUDFLARE_ACCOUNT_ID', FALLBACK_ACCOUNT)
  const token = getEnv('CLOUDFLARE_API_TOKEN', FALLBACK_TOKEN)
  const dbId = getEnv('D1_DATABASE_ID', FALLBACK_DB_ID)

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`D1 API ${res.status}: ${text.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.result?.[0] || { results: [], success: false }
}

export class CloudflareDB {
  async query(sql: string, params: any[] = []): Promise<any[]> {
    const r = await d1Query(sql, params)
    return r.results || []
  }
  async first(sql: string, params: any[] = []): Promise<any> {
    const r = await this.query(sql, params)
    return r[0] || null
  }
  async run(sql: string, params: any[] = []): Promise<void> {
    await d1Query(sql, params)
  }
}

let _db: CloudflareDB | null = null
export function getDB(): CloudflareDB {
  if (!_db) _db = new CloudflareDB()
  return _db
}
