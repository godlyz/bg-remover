// Credits management — query balance and consume credits

export async function getCreditBalance(env: any, userId: string): Promise<number> {
  const result = await env.DB.prepare(
    "SELECT COALESCE(SUM(remaining_credits), 0) as total FROM credit_packs WHERE user_id = ? AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > datetime('now'))"
  ).bind(userId).first();
  return (result as any)?.total || 0;
}

export async function consumeCredit(env: any, userId: string): Promise<{
  success: boolean;
  packId?: number;
  error?: string;
}> {
  // Find the pack to deduct from: earliest expiry first, NULL (permanent) last
  const pack = await env.DB.prepare(
    "SELECT id, remaining_credits FROM credit_packs WHERE user_id = ? AND remaining_credits > 0 AND (expires_at IS NULL OR expires_at > datetime('now')) ORDER BY expires_at ASC NULLS LAST LIMIT 1"
  ).bind(userId).first() as any;

  if (!pack) {
    return { success: false, error: "No credits available" };
  }

  const newRemaining = pack.remaining_credits - 1;

  if (newRemaining <= 0) {
    // Delete the empty pack
    await env.DB.prepare("DELETE FROM credit_packs WHERE id = ?").bind(pack.id).run();
  } else {
    await env.DB.prepare("UPDATE credit_packs SET remaining_credits = ? WHERE id = ?")
      .bind(newRemaining, pack.id).run();
  }

  return { success: true, packId: pack.id };
}

export async function addCreditPack(env: any, userId: string, credits: number, type: string, productId?: string, paypalOrderId?: string, expiresAt?: string | null): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO credit_packs (user_id, total_credits, remaining_credits, type, product_id, paypal_order_id, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(userId, credits, credits, type, productId || null, paypalOrderId || null, expiresAt || null).run();
}
