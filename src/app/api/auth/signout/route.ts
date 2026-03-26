export const runtime = "edge";

import { clearSessionCookie } from "@/lib/auth";

const SITE_URL = "https://www.bg-remover.site";

function getEnv(): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  return ctx?.env || {};
}

export async function POST(request: Request) {
  const env = getEnv();
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (match) {
    await env.KV.delete(`session:${match[1]}`);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: env.AUTH_URL || SITE_URL,
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
