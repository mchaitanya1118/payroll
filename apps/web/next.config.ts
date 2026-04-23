import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  serverActions: {
    allowedOrigins: ['192.168.0.153:3000', '192.168.0.153'],
  }
};

export default nextConfig;
