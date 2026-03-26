/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@imgly/background-removal",
        "onnxruntime-web",
      ];
      return config;
    }

    // Client-side: let webpack bundle onnxruntime-web but use Terser instead of SWC
    // because onnxruntime-web uses import.meta which breaks SWC minifier.
    const TerserPlugin = require("terser-webpack-plugin");
    config.optimization.minimizer = [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          format: { comments: false },
          compress: { drop_console: false },
        },
      }),
    ];

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
