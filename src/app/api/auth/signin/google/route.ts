export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

function getEnv(): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  return ctx?.env || {};
}

export async function GET(request: Request) {
  const env = getEnv();

  if (!env.AUTH_URL) {
    return new Response("AUTH_URL not configured", { status: 500 });
  }

  const state = generateState();
  await env.KV.put(`oauth_state:${state}`, "1", {
    expirationTtl: 300,
  });
  const url = getGoogleAuthURL(env, state);
  return Response.redirect(url, 302);
}
