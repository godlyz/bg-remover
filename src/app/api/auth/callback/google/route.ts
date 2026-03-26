export const runtime = "edge";

import { exchangeCodeForToken, decodeGoogleIdToken, generateSessionToken, setSessionCookie } from "@/lib/auth";

interface AppContext {
  env: {
    DB: any;
    KV: any;
    AUTH_URL: string;
  };
}

export async function GET(request: Request, context: AppContext) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.redirect(`${context.env.AUTH_URL}?error=auth_failed`, 302);
  }

  const storedState = await context.env.KV.get(`oauth_state:${state}`);
  if (!storedState) {
    return Response.redirect(`${context.env.AUTH_URL}?error=auth_failed`, 302);
  }
  await context.env.KV.delete(`oauth_state:${state}`);

  try {
    const { id_token } = await exchangeCodeForToken(code, context.env);
    const googleUser = decodeGoogleIdToken(id_token);

    const existing = await (context.env.DB as any).prepare("SELECT id FROM users WHERE google_id = ?")
      .bind(googleUser.sub)
      .first() as any || null;

    let userId: string;

    if (existing) {
      userId = existing.id;
      await (context.env.DB as any).prepare("UPDATE users SET name = ?, avatar_url = ? WHERE id = ?")
        .bind(googleUser.name, googleUser.picture, userId)
        .run();
    } else {
      const id = googleUser.sub.slice(0, 20);
      await (context.env.DB as any).prepare(
        "INSERT INTO users (id, google_id, email, name, avatar_url, plan) VALUES (?, ?, ?, ?, ?, 'free')"
      ).bind(id, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture).run();
      userId = id;

      await (context.env.DB as any).prepare(
        "INSERT INTO credit_packs (user_id, total_credits, remaining_credits, type, expires_at) VALUES (?, 3, 3, 'bonus', NULL)"
      ).bind(userId).run();
    }

    const sessionToken = generateSessionToken();
    await context.env.KV.put(`session:${sessionToken}`, JSON.stringify({
      userId,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${context.env.AUTH_URL}`,
        "Set-Cookie": setSessionCookie(sessionToken),
      },
    });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return Response.redirect(`${context.env.AUTH_URL}?error=auth_failed`, 302);
  }
}
