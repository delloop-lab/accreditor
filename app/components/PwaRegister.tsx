"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    // Only register in production mode (when running npm start or in production build)
    // In development, PWA is disabled via next.config.ts
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // process.env.NODE_ENV is set at build time by Next.js
    // When running `npm start`, NODE_ENV will be "production"
    // When running `npm run dev`, NODE_ENV will be "development"
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) return;

    // Use dynamic import for next-pwa/register
    // Note: With register: true in next.config.ts, this might be redundant,
    // but it ensures registration happens even if auto-registration fails
    import("next-pwa/register")
      .then(() => {
        console.info("[PWA] Service worker registration scheduled");
      })
      .catch((error) => {
        console.error("[PWA] Failed to load service worker registration", error);
      });
  }, []);

  return null;
}

