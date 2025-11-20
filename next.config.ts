import type { NextConfig } from "next";

const runtimeCaching = [
  {
    urlPattern: ({ request, url }: any) => {
      if (request.mode !== "navigate") return false;
      if (url.pathname.startsWith("/api")) return false;
      if (url.pathname.startsWith("/auth")) return false;
      if (url.pathname.startsWith("/login")) return false;
      if (url.pathname.startsWith("/dashboard/login")) return false;
      return true;
    },
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-cache",
      networkTimeoutSeconds: 10,
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60,
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
  {
    urlPattern: ({ request }: any) =>
      ["style", "script", "worker"].includes(request.destination),
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-resources-cache",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24,
      },
    },
  },
  {
    urlPattern: ({ request }: any) =>
      request.destination === "image",
    handler: "CacheFirst",
    options: {
      cacheName: "image-cache",
      expiration: {
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  {
    urlPattern: ({ request }: any) =>
      request.destination === "font",
    handler: "CacheFirst",
    options: {
      cacheName: "font-cache",
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  fallbacks: {
    document: "/offline",
  },
  buildExcludes: [
    /middleware-manifest\.json$/,
    /app-build-manifest\.json$/,
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },
};

export default withPWA(nextConfig);
