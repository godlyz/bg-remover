// Debug endpoint to check runtime environment bindings
export const runtime = "edge";

export async function GET(request: Request) {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];

  let symbolInfo: any = { exists: !!ctx };
  if (ctx?.env) {
    symbolInfo = {
      exists: true,
      keys: Object.keys(ctx.env).join(", "),
      hasKV: !!ctx.env.KV,
      hasDB: !!ctx.env.DB,
    };
  }

  let grcInfo: any = { tried: false };
  try {
    const mod = await import(
      /* webpackIgnore: true */
      "@cloudflare/next-on-pages" as string
    );
    const reqCtx = mod.getRequestContext();
    grcInfo = {
      tried: true,
      keys: Object.keys(reqCtx.env).join(", "),
      hasKV: !!reqCtx.env.KV,
      hasDB: !!reqCtx.env.DB,
    };
  } catch (e: any) {
    grcInfo = { tried: true, error: e.message };
  }

  return Response.json({ symbol: symbolInfo, getRequestContext: grcInfo });
}
