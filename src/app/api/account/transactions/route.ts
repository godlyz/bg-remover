export const runtime = "edge";

import { getEnv } from "@/lib/d1";

export async function GET(request: Request) {
  const env = getEnv(request);

  // Auth check
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match || !env.KV) {
    return Response.json({ transactions: [], error: "Not authenticated" }, { status: 401 });
  }

  const session = await env.KV.get(`session:${match[1]}`, "json");
  if (!session?.userId) {
    return Response.json({ transactions: [], error: "Session expired" }, { status: 401 });
  }

  const result = await env.DB.prepare(
    "SELECT id, product_type, amount, currency, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
  ).bind(session.userId).all();

  return Response.json({ transactions: result.results || [] });
}
