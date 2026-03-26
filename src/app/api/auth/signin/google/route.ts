export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

function getEnv(): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  return ctx?.env || {};
}

export async function GET(request: Request) {
  const env = getEnv();

  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
  }

  const state = generateState();
  if (env.KV) {
    await env.KV.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });
  }
  const url = getGoogleAuthURL(env, state);
  return Response.redirect(url, 302);
}
