import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error - Next.js new config option
  allowedDevOrigins: ['192.168.31.121'],
};

export default nextConfig;
