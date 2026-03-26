export const runtime = "edge";

const SITE_URL = "https://www.bg-remover.site";

function getEnv(): any {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  return ctx?.env || {};
}

export async function GET(request: Request) {
  const env = getEnv();
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match) return Response.json({ user: null });
  const session = await env.KV.get(`session:${match[1]}`, "json");
  return Response.json({ user: session || null });
}
