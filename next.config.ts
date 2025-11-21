import type { NextConfig } from "next";

const runtimeCaching = [
  {
    urlPattern: ({ request, url }: any) => {
      // Explicitly exclude API routes from all caching
      if (url.pathname.startsWith("/api")) return false;
      if (request.mode !== "navigate") return false;
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
  // Disable PWA only in development mode
  // In production (npm start), PWA will be enabled
  disable: process.env.NODE_ENV === "development",
  // Use custom service worker source file that includes push notification handling
  swSrc: "./sw.js",
  // Note: runtimeCaching is not used when swSrc is provided - caching is handled in sw.js
  fallbacks: {
    document: "/offline",
  },
  buildExcludes: [
    /middleware-manifest\.json$/,
    /app-build-manifest\.json$/,
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: false, // Temporarily disabled to fix layout router mounting issue
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config, { webpack, isServer }) => {
    config.module.rules.push({
      test: /\.js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    // Fix case sensitivity issues on Windows
    // Even though the actual path is lowercase, webpack may generate uppercase paths
    // Normalize ALL paths to lowercase to ensure consistency
    if (config.resolve) {
      config.resolve.symlinks = false;
    }
    
    // Normalize module identifiers for BOTH server and client
    // React Server Components bundler also needs path normalization
    config.plugins = config.plugins || [];
    
    const path = require('path');
    const projectRoot = path.resolve(__dirname).toLowerCase();
    
    // Function to normalize any path string to lowercase
    // Must be extremely aggressive to catch ALL variations including in module identifiers
    const normalizePath = (pathStr: string): string => {
      if (!pathStr || typeof pathStr !== 'string') return pathStr;
      // Convert entire string to lowercase for Windows paths
      // This is safe because Windows paths are case-insensitive
      let normalized = pathStr;
      // Replace any variation of the project path
      normalized = normalized.replace(/C:\\PROJECTS\\ACCREDITOR/gi, 'c:\\projects\\accreditor');
      // Normalize any Windows drive path (C:\, D:\, etc.) to lowercase
      normalized = normalized.replace(/([A-Z]):\\(.*)/g, (match, drive, rest) => {
        return `${drive.toLowerCase()}:\\${rest.toLowerCase()}`;
      });
      return normalized;
    };
    
    // Normalize webpack's context to ensure consistent casing from the start
    if (config.context) {
      config.context = normalizePath(config.context);
    }
    
    // Normalize module identifiers using webpack hooks
    // This ensures all paths are lowercase before webpack creates module IDs
    config.plugins.push({
      apply(compiler: any) {
        // Normalize context at compiler level
        if (compiler.context) {
          compiler.context = normalizePath(compiler.context);
        }
        
        compiler.hooks.normalModuleFactory.tap('CaseNormalizePlugin', (nmf: any) => {
          if (!nmf || !nmf.hooks) return;
          
          // Normalize during resolve - critical for catching paths early
          if (nmf.hooks.beforeResolve) {
            nmf.hooks.beforeResolve.tap('CaseNormalizePlugin', (data: any) => {
              if (!data) return;
              if (data.context && typeof data.context === 'string') {
                data.context = normalizePath(data.context);
              }
              if (data.request && typeof data.request === 'string') {
                data.request = normalizePath(data.request);
              }
            });
          }
          
          // Normalize after resolve - ensures final module paths are lowercase
          if (nmf.hooks.afterResolve) {
            nmf.hooks.afterResolve.tap('CaseNormalizePlugin', (data: any) => {
              if (!data) return;
              if (data.resource && typeof data.resource === 'string') {
                data.resource = normalizePath(data.resource);
              }
              if (data.userRequest && typeof data.userRequest === 'string') {
                data.userRequest = normalizePath(data.userRequest);
              }
              if (data.resourcePath && typeof data.resourcePath === 'string') {
                data.resourcePath = normalizePath(data.resourcePath);
              }
              if (data.context && typeof data.context === 'string') {
                data.context = normalizePath(data.context);
              }
            });
          }
          
          // Also normalize in the factory context
          if (nmf.context) {
            nmf.context = normalizePath(nmf.context);
          }
        });
      }
    });
    
    return config;
  },
};

export default withPWA(nextConfig);
