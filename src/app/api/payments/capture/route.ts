export const runtime = "edge";

import { getEnv } from "@/lib/d1";
import { PAYPAL_PRODUCTS, isValidProduct, getExpiryDate, getPayPalBaseUrl, getPayPalAccessToken, type PayPalProductId } from "@/lib/paypal";
import { addCreditPack, getCreditBalance } from "@/lib/credits";

// Called from frontend after PayPal redirect back with ?token=xxx
export async function POST(request: Request) {
  const env = getEnv(request);

  // Auth check
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match || !env.KV) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const session = await env.KV.get(`session:${match[1]}`, "json");
  if (!session?.userId) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  let body: { orderId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId } = body;
  if (!orderId) {
    return Response.json({ error: "Order ID required" }, { status: 400 });
  }

  try {
    // Check if already completed
    const existing = await env.DB.prepare(
      "SELECT status FROM transactions WHERE paypal_order_id = ? AND user_id = ?"
    ).bind(orderId, session.userId).first() as any;

    if (existing?.status === "completed") {
      const balance = await getCreditBalance(env, session.userId);
      return Response.json({ success: true, alreadyProcessed: true, balance });
    }

    // Capture the payment
    const accessToken = await getPayPalAccessToken(env);
    const baseUrl = await getPayPalBaseUrl(env);

    const captureResp = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResp.ok) {
      console.error("PayPal capture failed:", await captureResp.text());
      return Response.json({ error: "Payment capture failed" }, { status: 500 });
    }

    const captureData = await captureResp.json();

    if (captureData.status === "COMPLETED") {
      const txn = await env.DB.prepare(
        "SELECT product_type FROM transactions WHERE paypal_order_id = ? AND user_id = ?"
      ).bind(orderId, session.userId).first() as any;

      if (txn?.product_type && isValidProduct(txn.product_type)) {
        const pt = txn.product_type as PayPalProductId;
        const product = PAYPAL_PRODUCTS[pt];
        const expiresAt = getExpiryDate(pt);

        await addCreditPack(env, session.userId, product.credits, pt, pt, orderId, expiresAt);

        await env.DB.prepare(
          "UPDATE transactions SET status = 'completed', paypal_response = ? WHERE paypal_order_id = ?"
        ).bind(JSON.stringify(captureData), orderId).run();

        const balance = await getCreditBalance(env, session.userId);

        return Response.json({
          success: true,
          balance,
          product: { name: product.name, credits: product.credits },
        });
      }
    }

    return Response.json({ success: false, error: "Payment not completed", status: captureData.status });
  } catch (err) {
    console.error("Capture error:", err);
    return Response.json({ error: "Payment processing error" }, { status: 500 });
  }
}
