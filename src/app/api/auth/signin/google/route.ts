export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

function getEnv(): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  // Return the actual env if available, otherwise build a fallback
  if (ctx?.env?.AUTH_URL) return ctx.env;
  // Fallback: CF Pages might pass env differently
  return ctx?.env || {
    AUTH_URL: "https://www.bg-remover.site",
  };
}

export async function GET(request: Request) {
  const env = getEnv();
  const authUrl = env.AUTH_URL || "https://www.bg-remover.site";

  const state = generateState();
  if (env.KV) {
    await env.KV.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });
  }
  const url = getGoogleAuthURL(env, state);
  return Response.redirect(url, 302);
}
