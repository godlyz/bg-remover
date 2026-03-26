/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // @imgly/background-removal must only run client-side, loaded via script tag at runtime
    // to avoid webpack bundling issues with onnxruntime-web (uses import.meta)
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@imgly/background-removal",
        "onnxruntime-web",
      ];
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },
};

module.exports = nextConfig;
