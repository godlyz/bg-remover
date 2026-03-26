export const runtime = "edge";

import { getEnv } from "@/lib/d1";
import { getCreditBalance } from "@/lib/credits";

export async function GET(request: Request) {
  const env = getEnv(request);

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match || !env.KV) {
    return Response.json({ balance: 0, error: "Not authenticated" }, { status: 401 });
  }

  const session = await env.KV.get(`session:${match[1]}`, "json");
  if (!session?.userId) {
    return Response.json({ balance: 0, error: "Session expired" }, { status: 401 });
  }

  const balance = await getCreditBalance(env, session.userId);

  // Get credit packs breakdown
  const packs = await env.DB.prepare(
    "SELECT id, total_credits, remaining_credits, type, expires_at FROM credit_packs WHERE user_id = ? AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY expires_at ASC NULLS LAST"
  ).bind(session.userId).all();

  return Response.json({
    balance,
    packs: packs.results || [],
  });
}
