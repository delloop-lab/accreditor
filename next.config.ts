import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable server-side rendering for client components that use browser APIs
  reactStrictMode: true,
};

export default nextConfig;
