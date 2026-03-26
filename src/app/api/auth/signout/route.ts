export const runtime = "edge";

import { clearSessionCookie, getAuthUrl } from "@/lib/auth";

export async function POST(request: Request) {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  const env = ctx?.env;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (match && env?.KV) {
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
