export const runtime = "edge";

import { clearSessionCookie } from "@/lib/auth";

interface AppContext {
  env: { KV: any; AUTH_URL: string };
}

export async function POST(request: Request, context: AppContext) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (match) {
    await context.env.KV.delete(`session:${match[1]}`);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: context.env.AUTH_URL,
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
