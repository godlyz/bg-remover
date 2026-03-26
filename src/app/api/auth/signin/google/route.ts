export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

export async function GET(request: Request) {
  // CF Pages stores env bindings via Symbol
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  const env = ctx?.env;

  if (!env || !env.GOOGLE_CLIENT_ID) {
    console.error("getEnv failed. ctx exists:", !!ctx, "env exists:", !!env, "keys:", env ? Object.keys(env).join(",") : "none");
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 });
  }

  const state = generateState();
  await env.KV.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });
  const url = getGoogleAuthURL(env, state);
  return Response.redirect(url, 302);
}
