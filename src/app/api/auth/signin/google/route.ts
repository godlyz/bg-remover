export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

async function getEnv(): Promise<any> {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  if (ctx?.env?.GOOGLE_CLIENT_ID) return ctx.env;

  // Fallback: try getRequestContext directly
  try {
    const mod = await import(
      /* webpackIgnore: true */
      "@cloudflare/next-on-pages" as string
    );
    return mod.getRequestContext().env;
  } catch {
    return ctx?.env || {};
  }
}

export async function GET(request: Request) {
  const env = await getEnv();

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
