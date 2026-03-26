export const runtime = "edge";

import { getEnv, dbFirst, dbRun } from "@/lib/d1";
import { getCreditBalance, consumeCredit } from "@/lib/credits";

// Remove.bg API — 3 key rotation (pick least used)
async function getRemoveBgKey(env: any): Promise<string> {
  const configs = await getConfig(env);
  const keys = (configs.RB_API_KEYS || "").split(",").map((k: string) => k.trim()).filter(Boolean);

  if (keys.length === 0) {
    throw new Error("No Remove.bg API keys configured");
  }

  // Pick random key (simple rotation; could track usage in KV for smarter routing)
  return keys[Math.floor(Math.random() * keys.length)];
}

async function getConfig(env: any): Promise<Record<string, string>> {
  try {
    const result = await env.DB.prepare("SELECT key, value FROM site_config").all();
    const configs: Record<string, string> = {};
    for (const row of result.results || []) {
      configs[row.key] = row.value;
    }
    return configs;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const env = getEnv(request);

  // 1. Auth check — must be logged in
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/bgfree-session=([^;]+)/);
  if (!match || !env.KV) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const session = await env.KV.get(`session:${match[1]}`, "json");
  if (!session?.userId) {
    return Response.json({ error: "Session expired, please login again" }, { status: 401 });
  }

  // 2. Credit check
  const balance = await getCreditBalance(env, session.userId);
  if (balance <= 0) {
    return Response.json({
      error: "No credits available",
      balance: 0,
      purchaseUrl: "/pricing",
    }, { status: 402 });
  }

  // 3. Get image from request
  const formData = await request.formData();
  const file = formData.get("image") as File;
  if (!file) {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: "Invalid file type. Only JPG, PNG, WebP allowed." }, { status: 400 });
  }

  // Validate file size (max 12MB)
  if (file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "File too large. Max 12MB." }, { status: 400 });
  }

  // 4. Consume credit
  const creditResult = await consumeCredit(env, session.userId);
  if (!creditResult.success) {
    return Response.json({ error: creditResult.error || "Failed to consume credit" }, { status: 500 });
  }

  // 5. Call Remove.bg API
  try {
    const apiKey = await getRemoveBgKey(env);
    const formDataBody = new FormData();
    formDataBody.append("image_file", file);
    formDataBody.append("size", "auto");

    const startTime = Date.now();
    const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formDataBody,
    });

    const processingTime = Date.now() - startTime;

    if (!resp.ok) {
      const errText = await resp.text();

      // Log failed usage
      await dbRun(env,
        "INSERT INTO api_usage_logs (user_id, credit_pack_id, image_size, processing_time_ms, status, error_message) VALUES (?, ?, ?, ?, 'failed', ?)",
        session.userId, creditResult.packId, file.size, processingTime, errText.substring(0, 500)
      );

      // Refund credit on API failure
      await env.DB.prepare(
        "UPDATE credit_packs SET remaining_credits = remaining_credits + 1 WHERE id = ?"
      ).bind(creditResult.packId).run();

      if (resp.status === 402) {
        return Response.json({ error: "API quota exceeded. Please try again later." }, { status: 503 });
      }
      return Response.json({ error: `Processing failed: ${resp.status}` }, { status: 500 });
    }

    // Log successful usage
    await dbRun(env,
      "INSERT INTO api_usage_logs (user_id, credit_pack_id, image_size, processing_time_ms, status) VALUES (?, ?, ?, ?, 'success')",
      session.userId, creditResult.packId, file.size, processingTime
    );

    // Return processed image
    const imageBlob = await resp.blob();
    const newBalance = await getCreditBalance(env, session.userId);

    return new Response(imageBlob, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "X-Credits-Remaining": newBalance.toString(),
      },
    });
  } catch (err) {
    console.error("Remove.bg API error:", err instanceof Error ? err.message : String(err));
    // Refund credit on error
    if (creditResult.packId) {
      await env.DB.prepare(
        "UPDATE credit_packs SET remaining_credits = remaining_credits + 1 WHERE id = ?"
      ).bind(creditResult.packId).run();
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Processing error: ${msg}. Credit refunded.` }, { status: 500 });
  }
}
