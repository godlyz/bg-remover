export const runtime = "edge";

export async function GET(request: Request) {
  const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
  const env = ctx?.env;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match || !env) return Response.json({ user: null });
  const session = await env.KV.get(`session:${match[1]}`, "json");
  return Response.json({ user: session || null });
}
