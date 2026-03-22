/**
 * Cloudflare D1 HTTP API 客户端
 * 
 * 不依赖 @cloudflare/next-on-pages 的 bindings。
 * 直接通过 Cloudflare REST API 操作 D1 数据库。
 * 
 * 优势：不依赖 Cloudflare 绑定机制，兼容任何部署方式。
 * 劣势：每次请求多一次 HTTP 调用（D1 API 在同数据中心 < 5ms）。
 */

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'

interface D1Result {
  results: any[]
  success: boolean
  meta: any
}

async function d1Query(sql: string, params: any[] = []): Promise<D1Result> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`D1 API error ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return data.result?.[0] || { results: [], success: false, meta: {} }
}

export class CloudflareDB {
  /**
   * 执行 SQL 查询
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    const result = await d1Query(sql, params)
    return result.results || []
  }

  /**
   * 执行 SQL 查询，返回第一行
   */
  async first(sql: string, params: any[] = []): Promise<any> {
    const results = await this.query(sql, params)
    return results[0] || null
  }

  /**
   * 执行 SQL（INSERT/UPDATE/DELETE）
   */
  async run(sql: string, params: any[] = []): Promise<void> {
    await d1Query(sql, params)
  }
}

/** 全局单例 */
let _db: CloudflareDB | null = null
export function getDB(): CloudflareDB {
  if (!_db) _db = new CloudflareDB()
  return _db
}
