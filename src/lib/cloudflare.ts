/**
 * 获取 Cloudflare env bindings (D1, KV etc.)
 * 
 * IMPORTANT: getRequestContext 只能在 request handler 内部调用。
 * @cloudflare/next-on-pages 通过 AsyncLocalStorage 注入 request context。
 * 
 * 在构建后的 _worker.js 中，env 通过 requestContextAsyncLocalStorage 提供。
 * 直接从全局 Symbol 获取：
 */

export function getCloudflareEnv(): any {
  const symbol = Symbol.for('__cloudflare-request-context__')
  const store = (globalThis as any)[symbol]
  if (store) {
    return store.env || {}
  }
  return {}
}
