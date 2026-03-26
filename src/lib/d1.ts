// Get Cloudflare env from request context (@cloudflare/next-on-pages)
export function getEnv(request?: Request): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  return ctx?.env || {};
}

// Get session from cookie
export function getSession(request: Request, kv: any): any | null {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match) return null;
  // KV.get returns cached value; actual KV call happens at runtime
  return match[1]; // Return token, caller must KV.get
}

// Helper: run D1 query and return results
export async function dbQuery(env: any, sql: string, ...bindings: any[]): Promise<any[]> {
  try {
    const result = await env.DB.prepare(sql).bind(...bindings).all();
    return result.results || [];
  } catch (err) {
    console.error("D1 query error:", sql, err);
    throw err;
  }
}

// Helper: run D1 query and return first row
export async function dbFirst(env: any, sql: string, ...bindings: any[]): Promise<any> {
  try {
    return await env.DB.prepare(sql).bind(...bindings).first();
  } catch (err) {
    console.error("D1 first error:", sql, err);
    throw err;
  }
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
