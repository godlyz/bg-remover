// Auth utilities for Google OAuth 2.0

const SITE_URL = "https://www.bg-remover.site";

export function generateState(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateSessionToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getAuthUrl(env: any): string {
  return env?.AUTH_URL || SITE_URL;
}

export function getGoogleAuthURL(env: any, state: string): string {
  const authUrl = getAuthUrl(env);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${authUrl}/api/auth/callback/google`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForToken(
  code: string,
  env: any
): Promise<{ access_token: string; id_token: string }> {
  const authUrl = getAuthUrl(env);
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${authUrl}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });
  if (!resp.ok) throw new Error(`Google token exchange failed: ${resp.status}`);
  const data = await resp.json();
  return { access_token: data.access_token, id_token: data.id_token };
}

export function decodeGoogleIdToken(
  idToken: string
): { sub: string; email: string; name: string; picture: string | null } {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid id_token");
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || "",
    picture: payload.picture || null,
  };
}

export function setSessionCookie(token: string): string {
  return `bgfree-session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return "bgfree-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
