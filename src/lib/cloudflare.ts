/**
 * 获取 Cloudflare env bindings (D1, KV etc.)
 * 
 * 使用 @cloudflare/next-on-pages 的 getRequestContext API
 * 必须在请求处理上下文中调用
 */
export function getCloudflareEnv(): any {
  try {
    const { getRequestContext } = require('@cloudflare/next-on-pages/api')
    const ctx = getRequestContext()
    return ctx.env || {}
  } catch (e) {
    // console.error('getCloudflareEnv error:', e)
    return {}
  }
}
