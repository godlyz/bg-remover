export const runtime = "edge";

import { getEnv } from "@/lib/d1";
import { PAYPAL_PRODUCTS, isValidProduct, getExpiryDate, getPayPalBaseUrl, getPayPalAccessToken, type PayPalProductId } from "@/lib/paypal";
import { addCreditPack } from "@/lib/credits";

export async function POST(request: Request) {
  const env = getEnv(request);

  try {
    const body = await request.json();

    // Verify webhook signature (simplified for MVP — production should verify)
    const eventType = body.event_type;

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      // Order approved by user — capture the payment
      const orderId = body.resource?.id;
      if (!orderId) {
        return Response.json({ error: "No order ID" }, { status: 400 });
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
        return Response.json({ error: "Capture failed" }, { status: 500 });
      }

      const captureData = await captureResp.json();
      const captureStatus = captureData.status; // COMPLETED

      if (captureStatus === "COMPLETED") {
        // Find the transaction
        const txn = await env.DB.prepare(
          "SELECT * FROM transactions WHERE paypal_order_id = ?"
        ).bind(orderId).first() as any;

        if (txn && txn.product_type && isValidProduct(txn.product_type)) {
          const pt = txn.product_type as PayPalProductId;
          const product = PAYPAL_PRODUCTS[pt];
          const userId = txn.user_id;
          const expiresAt = getExpiryDate(pt);

          // Add credits
          await addCreditPack(env, userId, product.credits, pt, pt, orderId, expiresAt);

          // Update transaction status
          await env.DB.prepare(
            "UPDATE transactions SET status = 'completed', paypal_response = ? WHERE paypal_order_id = ?"
          ).bind(JSON.stringify(captureData), orderId).run();
        }
      }

      return Response.json({ received: true, status: captureStatus });
    }

    // Handle subscription events (for monthly plans)
    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
      const subId = body.resource?.id;
      const planId = body.resource?.plan_id;
      // Future: map plan_id to product_type and add credits
      console.log("Subscription activated:", subId, planId);
      return Response.json({ received: true });
    }

    return Response.json({ received: true, event: eventType });
  } catch (err) {
    console.error("Webhook error:", err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
