export const runtime = "edge";

import { clearSessionCookie, getAuthUrl } from "@/lib/auth";

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

export async function POST(request: Request) {
  const env = await getEnv();
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (match) {
    await env.KV.delete(`session:${match[1]}`);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: getAuthUrl(env),
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
