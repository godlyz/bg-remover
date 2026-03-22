import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next-on-pages 适配
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
