export const runtime = "edge";

interface AppContext {
  env: { KV: any };
}

export async function GET(request: Request, context: AppContext) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match) return Response.json({ user: null });
  const session = await context.env.KV.get(`session:${match[1]}`, "json");
  return Response.json({ user: session || null });
}
