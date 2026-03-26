export const runtime = "edge";

async function getEnv(): Promise<any> {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  if (ctx?.env?.KV) return ctx.env;

  try {
    const mod = await import(
      /* webpackIgnore: true */
      "@cloudflare/next-on-pages" as string
    );
    return mod.getRequestContext().env;
  } catch {
    return ctx?.env || {};
  }
}

export async function GET(request: Request) {
  const env = await getEnv();
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match) return Response.json({ user: null });
  const session = await env.KV.get(`session:${match[1]}`, "json");
  return Response.json({ user: session || null });
}
