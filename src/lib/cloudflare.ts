/**
 * Cloudflare D1 HTTP API 客户端
 * 
 * 通过 Cloudflare REST API 操作 D1 数据库
 * 环境变量通过 GitHub Actions 注入到 Pages 运行时
 */

const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
const DB_ID = process.env.D1_DATABASE_ID || 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'

async function d1Query(sql: string, params: any[] = []): Promise<any> {
  if (!ACCOUNT || !TOKEN) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN env var')
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/d1/database/${DB_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
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
