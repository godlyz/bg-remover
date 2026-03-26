export const runtime = "edge";

import { clearSessionCookie, getAuthUrl } from "@/lib/auth";

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
      Location: getAuthUrl(env),
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
