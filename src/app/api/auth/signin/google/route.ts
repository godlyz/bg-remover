export const runtime = "edge";

import { generateState, getGoogleAuthURL } from "@/lib/auth";

interface AppContext {
  env: { KV: any; AUTH_URL: string; GOOGLE_CLIENT_ID: string };
}

export async function GET(request: Request, context: AppContext) {
  const state = generateState();
  await context.env.KV.put(`oauth_state:${state}`, "1", {
    expirationTtl: 300,
  });
  const url = getGoogleAuthURL(context.env, state);
  return Response.redirect(url, 302);
}
