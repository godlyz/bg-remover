/**
 * Load @imgly/background-removal from CDN at runtime.
 * Uses fetch + blob URL to bypass webpack bundling issues.
 */

type RemoveBackgroundFn = (
  image: File | Blob | string,
  config?: Record<string, unknown>,
) => Promise<Blob>;

let loadPromise: Promise<RemoveBackgroundFn> | null = null;

export async function loadBgRemoval(): Promise<RemoveBackgroundFn> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      // Fetch the ESM bundle from CDN
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.mjs"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const code = await res.text();

      // Create a blob URL and import it as an ES module
      const blob = new Blob([code], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);

      const mod = await import(url);
      URL.revokeObjectURL(url);

      return (mod.default || (mod as any).removeBackground || mod) as RemoveBackgroundFn;
    } catch (err) {
      throw new Error(
        `Failed to load AI engine: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  })();

  return loadPromise;
}
