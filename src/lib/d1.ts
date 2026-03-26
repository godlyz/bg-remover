// Get Cloudflare env from request context (@cloudflare/next-on-pages)
export function getEnv(request?: Request): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  return ctx?.env || {};
}

// Helper: run D1 mutation
export async function dbRun(env: any, sql: string, ...bindings: any[]): Promise<void> {
  try {
    await env.DB.prepare(sql).bind(...bindings).run();
  } catch (err) {
    console.error("D1 run error:", sql, err);
    throw err;
  }
}
