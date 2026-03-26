/**
 * Load @imgly/background-removal from CDN at runtime.
 * Uses webpackIgnore to skip bundling — avoids onnxruntime-web import.meta issues.
 */

type RemoveBackgroundFn = (
  image: File | Blob | string,
  config?: Record<string, unknown>,
) => Promise<Blob>;

let loadPromise: Promise<RemoveBackgroundFn> | null = null;

export async function loadBgRemoval(): Promise<RemoveBackgroundFn> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Dynamic import from jsDelivr CDN, skip webpack bundling
    const mod = await import(
      /* webpackIgnore: true */
      "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.mjs"
    );
    return (mod.default || mod) as RemoveBackgroundFn;
  })();

  return loadPromise;
}
