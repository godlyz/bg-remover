/**
 * 获取 Cloudflare env bindings (D1, KV etc.)
 * 
 * 最后的手段：直接访问 _worker.js 暴露的 globalThis 状态
 */
export function getCloudflareEnv(): any {
  try {
    // _worker.js 把 requestContextAsyncLocalStorage 暴露在全局
    // 通过 __ALSes_PROMISE__ 获取
    const promise = (globalThis as any).__ALSes_PROMISE__
    if (promise && typeof promise.then === 'function') {
      // 这是一个 promise，已经被 run 了，可以直接访问 store
      // 但实际上需要从 AsyncLocalStorage 获取
    }
  } catch {}

  try {
    // 最后尝试 Symbol.for 方式
    const symbol = Symbol.for('__cloudflare-request-context__')
    const proxy = (globalThis as any)[symbol]
    if (proxy) {
      const env = proxy.env
      if (env && Object.keys(env).length > 0) {
        return env
      }
    }
  } catch {}

  return {}
}
