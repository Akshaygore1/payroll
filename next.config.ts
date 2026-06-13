import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackSourceMaps: false,
  },
};

export default nextConfig;
