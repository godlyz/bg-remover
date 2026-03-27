// PayPal product definitions matching the pricing table
export const PAYPAL_PRODUCTS = {
  pack_10: { name: "Credit Pack · 10", credits: 10, price: "4.99", currency: "USD", expiresDays: 365 },
  pack_30: { name: "Credit Pack · 30", credits: 30, price: "12.99", currency: "USD", expiresDays: 365 },
  pack_80: { name: "Credit Pack · 80", credits: 80, price: "29.99", currency: "USD", expiresDays: 365 },
  monthly_25: { name: "Monthly · 25", credits: 25, price: "9.99", currency: "USD", expiresDays: 30 },
  monthly_60: { name: "Monthly · 60", credits: 60, price: "19.99", currency: "USD", expiresDays: 30 },
} as const;

export type PayPalProductId = keyof typeof PAYPAL_PRODUCTS;

// Validate product ID
export function isValidProduct(productId: string): productId is PayPalProductId {
  return productId in PAYPAL_PRODUCTS;
}

// Calculate expiry date from product type
export function getExpiryDate(productId: PayPalProductId): string {
  const product = PAYPAL_PRODUCTS[productId];
  const expires = new Date();
  expires.setDate(expires.getDate() + product.expiresDays);
  return expires.toISOString();
}

// Get PayPal API base URL (sandbox vs production)
// Reads from site_config table first, falls back to env variable
export async function getPayPalBaseUrl(env: any): Promise<string> {
  const configs = await getSiteConfig(env);
  const sandboxValue = configs.PAYPAL_SANDBOX ?? env.PAYPAL_SANDBOX;
  const useSandbox = sandboxValue !== "false";
  return useSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

// Get PayPal access token
export async function getPayPalAccessToken(env: any): Promise<string> {
  const baseUrl = await getPayPalBaseUrl(env);
  const configs = await getSiteConfig(env);
  const clientId = configs.PAYPAL_CLIENT_ID || env.PAYPAL_CLIENT_ID;
  const clientSecret = configs.PAYPAL_CLIENT_SECRET || env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const resp = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!resp.ok) throw new Error(`PayPal auth failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
}

async function getSiteConfig(env: any): Promise<Record<string, string>> {
  try {
    const result = await env.DB.prepare("SELECT key, value FROM site_config").all();
    const configs: Record<string, string> = {};
    for (const row of result.results || []) {
      configs[row.key] = row.value;
    }
    return configs;
  } catch {
    return {};
  }
}
