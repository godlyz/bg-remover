// Cloudflare Pages environment types
export interface Env {
  DB: any;
  KV: any;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  AUTH_URL: string;
  JWT_SECRET: string;
}

export interface Session {
  userId: number | string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export function setSessionCookie(token: string): string {
  return `bgfree-session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return "bgfree-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
