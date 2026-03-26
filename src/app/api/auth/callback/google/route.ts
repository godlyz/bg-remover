export const runtime = "edge";

import { exchangeCodeForToken, decodeGoogleIdToken, generateSessionToken, setSessionCookie } from "@/lib/auth";

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

  if (!env) {
    return new Response(JSON.stringify({ error: "Cloudflare context not available" }), { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const authUrl = (await getConfig(env)).AUTH_URL || env.AUTH_URL || "https://www.bg-remover.site";

  if (error || !code || !state) {
    return Response.redirect(`${authUrl}?error=auth_failed`, 302);
  }

  const storedState = await env.KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return Response.redirect(`${authUrl}?error=auth_failed`, 302);
  }
  await env.KV.delete(`oauth_state:${state}`);

  try {
    const configs = await getConfig(env);
    const clientId = configs.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID;
    const clientSecret = configs.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "OAuth credentials not configured" }), { status: 500 });
    }

    const { id_token } = await exchangeCodeForToken(code, { ...env, GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret });
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
        "INSERT INTO users (id, google_id, email, name, avatar_url, plan) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(id, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture, "free").run();
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
