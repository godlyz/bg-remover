export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

async function getConfig(env: any): Promise<Record<string, string>> {
  try {
    const result = await (env.DB as any).prepare("SELECT key, value FROM site_config").all();
    const configs: Record<string, string> = {};
    for (const row of result.results || []) {
      configs[row.key] = row.value;
    }
    return configs;
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  const env = ctx?.env;

  const configs = await getConfig(env);
  const clientId = configs.GOOGLE_CLIENT_ID || env?.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return new Response(JSON.stringify({ error: "GOOGLE_CLIENT_ID not configured" }), { status: 500 });
  }

  const envWithId = { ...env, GOOGLE_CLIENT_ID: clientId };

  const state = generateState();
  if (env?.KV) {
    await env.KV.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });
  }

  const url = getGoogleAuthURL(envWithId, state);
  return Response.redirect(url, 302);
}
