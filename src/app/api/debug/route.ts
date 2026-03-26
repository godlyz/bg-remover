export const runtime = "edge";

export async function GET(request: Request) {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];

  // Try getRequestContext
  let rctx: any = null;
  try {
    const mod = await import("@cloudflare/next-on-pages");
    rctx = mod.getRequestContext ? mod.getRequestContext() : "not available";
  } catch (e: any) {
    rctx = `error: ${e.message}`;
  }

  return Response.json({
    globalThis_ctx: ctx ? {
      hasEnv: !!ctx.env,
      envKeys: Object.keys(ctx.env || {}),
      hasDB: !!ctx.env?.DB,
      hasKV: !!ctx.env?.KV,
    } : "not found",
    requestContext: rctx ? {
      type: typeof rctx,
      value: typeof rctx === "object" ? {
        hasEnv: !!rctx?.env,
        envKeys: Object.keys(rctx?.env || {}),
      } : rctx
    } : "not found",
    cookies: request.headers.get("Cookie") || "none",
    cookieMatch: (request.headers.get("Cookie") || "").match(/bgfree-session=([^;]+)/)?.[1] ? "session found" : "no session",
  });
}
