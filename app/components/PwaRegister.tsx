"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

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

