export const runtime = "edge";

import { getEnv } from "@/lib/d1";
import { PAYPAL_PRODUCTS, isValidProduct, getExpiryDate, getPayPalBaseUrl, getPayPalAccessToken } from "@/lib/paypal";
import { addCreditPack } from "@/lib/credits";

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

  // Parse request body
  let body: { productId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { productId } = body;
  if (!productId || !isValidProduct(productId)) {
    return Response.json({
      error: "Invalid product ID",
      available: Object.keys(PAYPAL_PRODUCTS),
    }, { status: 400 });
  }

  const product = PAYPAL_PRODUCTS[productId];

  try {
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(env);
    const baseUrl = getPayPalBaseUrl(env);

    const configs: Record<string, string> = {};
    try {
      const result = await env.DB.prepare("SELECT key, value FROM site_config").all();
      for (const row of result.results || []) {
        configs[row.key] = row.value;
      }
    } catch {}

    const authUrl = configs.AUTH_URL || "https://www.bg-remover.site";

    // Create PayPal order
    const orderResp = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `${session.userId}_${productId}_${Date.now()}`,
          description: product.name,
          amount: {
            currency_code: product.currency,
            value: product.price,
          },
        }],
        application_context: {
          brand_name: "BGFree",
          return_url: `${authUrl}/pricing?payment=success`,
          cancel_url: `${authUrl}/pricing?payment=cancelled`,
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!orderResp.ok) {
      const errText = await orderResp.text();
      console.error("PayPal order creation failed:", errText);
      return Response.json({ error: "Failed to create payment order" }, { status: 500 });
    }

    const orderData = await orderResp.json();

    // Store pending transaction in D1
    await env.DB.prepare(
      "INSERT INTO transactions (user_id, paypal_order_id, product_type, amount, currency, status) VALUES (?, ?, ?, ?, ?, 'pending')"
    ).bind(
      session.userId,
      orderData.id,
      productId,
      parseFloat(product.price),
      product.currency
    ).run();

    // Find the approve URL from PayPal response
    const approveLink = orderData.links?.find((l: any) => l.rel === "approve");

    return Response.json({
      orderId: orderData.id,
      approveUrl: approveLink?.href || "",
      product: {
        id: productId,
        name: product.name,
        credits: product.credits,
        price: product.price,
      },
    });
  } catch (err) {
    console.error("PayPal error:", err);
    return Response.json({ error: "Payment processing error" }, { status: 500 });
  }
}
