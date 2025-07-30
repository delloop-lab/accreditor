import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for better error detection
  reactStrictMode: true,
  
  // Add compiler options for better debugging
  compiler: {
    // Remove console.logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
