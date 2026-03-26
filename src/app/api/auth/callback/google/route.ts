export const runtime = "edge";

import { exchangeCodeForToken, decodeGoogleIdToken, generateSessionToken, setSessionCookie, getAuthUrl } from "@/lib/auth";

async function getEnv(): Promise<any> {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  if (ctx?.env?.GOOGLE_CLIENT_ID) return ctx.env;

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

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const authUrl = getAuthUrl(env);

  if (error || !code || !state) {
    return Response.redirect(`${authUrl}?error=auth_failed`, 302);
  }

  const storedState = await env.KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return Response.redirect(`${authUrl}?error=auth_failed`, 302);
  }
  await env.KV.delete(`oauth_state:${state}`);

  try {
    const { id_token } = await exchangeCodeForToken(code, env);
    const googleUser = decodeGoogleIdToken(id_token);

    const existing = await (env.DB as any).prepare("SELECT id FROM users WHERE google_id = ?")
      .bind(googleUser.sub)
      .first() as any || null;

    let userId: string;

    if (existing) {
      userId = existing.id;
      await (env.DB as any).prepare("UPDATE users SET name = ?, avatar_url = ? WHERE id = ?")
        .bind(googleUser.name, googleUser.picture, userId)
        .run();
    } else {
      const id = googleUser.sub.slice(0, 20);
      await (env.DB as any).prepare(
        "INSERT INTO users (id, google_id, email, name, avatar_url, plan) VALUES (?, ?, ?, ?, ?, 'free')"
      ).bind(id, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture).run();
      userId = id;

      await (env.DB as any).prepare(
        "INSERT INTO credit_packs (user_id, total_credits, remaining_credits, type, expires_at) VALUES (?, 3, 3, 'bonus', NULL)"
      ).bind(userId).run();
    }

    const sessionToken = generateSessionToken();
    await env.KV.put(`session:${sessionToken}`, JSON.stringify({
      userId,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        "Set-Cookie": setSessionCookie(sessionToken),
      },
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return Response.redirect(`${authUrl}?error=auth_failed`, 302);
  }
}
