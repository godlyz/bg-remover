declare module "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/dist/index.mjs" {
  const removeBackground: (
    image: File | Blob | string,
    config?: Record<string, unknown>,
  ) => Promise<Blob>;
  export default removeBackground;
  export { removeBackground };
}
