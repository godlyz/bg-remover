/**
 * 获取 Cloudflare env bindings (D1, KV etc.)
 * 
 * CRITICAL: 必须在请求处理函数内部调用，不能在模块顶层调用。
 * @cloudflare/next-on-pages 通过 AsyncLocalStorage 注入 env，
 * 只有在请求上下文中才能获取。
 */
export function getCloudflareEnv(): any {
  try {
    // 动态 require 确保在请求上下文中执行
    const nextOnPages = require('@cloudflare/next-on-pages/api')
    const ctx = nextOnPages.getRequestContext()
    if (ctx && ctx.env) {
      return ctx.env
    }
  } catch (e) {
    console.error('getCloudflareEnv error:', e)
  }
  return {}
}
