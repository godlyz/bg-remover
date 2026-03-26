/**
 * Load @imgly/background-removal from local npm package via dynamic import.
 * Webpack bundles everything client-side; server-side excluded in next.config.js.
 */

type RemoveBackgroundFn = (
  image: File | Blob | string,
  config?: Record<string, unknown>,
) => Promise<Blob>;

let loadPromise: Promise<RemoveBackgroundFn> | null = null;

export async function loadBgRemoval(): Promise<RemoveBackgroundFn> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const mod = await import("@imgly/background-removal");
    // @ts-ignore — dynamic import typing
    return (mod.default || mod.removeBackground || mod) as RemoveBackgroundFn;
  })();

  return loadPromise;
}
