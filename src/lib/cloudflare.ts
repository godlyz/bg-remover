/**
 * 获取 Cloudflare D1 数据库绑定
 * 在 Cloudflare Pages 上通过 getRequestContext 获取
 */
export async function getDB(): Promise<any> {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages/worker')
    const ctx = getRequestContext()
    return ctx.env.DB
  } catch {
    return null
  }
}

/**
 * 获取 Cloudflare KV 绑定
 */
export async function getKV(): Promise<any> {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages/worker')
    const ctx = getRequestContext()
    return ctx.env.KV
  } catch {
    return null
  }
}
