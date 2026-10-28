"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      console.error("VYBE service worker registration failed:", error);
    });
  }, []);

  return null;
}
