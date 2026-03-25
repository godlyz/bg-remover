/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // @imgly/background-removal and onnxruntime-web should only be loaded client-side at runtime
    // via dynamic import(). Exclude from both server and client bundles to avoid webpack
    // trying to parse import.meta statements in onnxruntime-web.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Make onnxruntime-web resolve to false during build — it loads itself at runtime
        "onnxruntime-web": false,
      };
    }

    // Server-side: exclude entirely
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
