"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { startOfflineSync } from "@/lib/offline/client";
import { useOfflineStatus } from "@/lib/offline/use-offline";

/**
 * Starts the offline machinery once for the whole application.
 *
 * Two jobs:
 * 1. Register the service worker so pages already visited stay readable.
 * 2. Attach the listeners that flush the outbox when the connection returns.
 *
 * Rendered once from the application shell; it draws nothing.
 */
export function OfflineSync() {
  const router = useRouter();
  const { lastSyncedAt } = useOfflineStatus();
  const applied = useRef<string | null>(null);

  useEffect(() => startOfflineSync(), []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reloading = false;
    const onControllerChange = () => {
      // A new worker took over. Reload once so the page runs against the new
      // caches; the guard stops a reload loop if the worker changes again.
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  useEffect(() => {
    // The queue reached the server, so server-rendered pages are now stale.
    if (!lastSyncedAt || applied.current === lastSyncedAt) return;
    applied.current = lastSyncedAt;
    router.refresh();
  }, [lastSyncedAt, router]);

  return null;
}
