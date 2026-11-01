"use client";

import { useEffect, useState } from "react";
import {
  getOfflineSnapshot,
  subscribeOffline,
  type OfflineSnapshot,
} from "./client";

/**
 * Subscribes a component to the offline queue.
 *
 * The first render uses the module snapshot, which is empty on both the server
 * and the client, so hydration matches. The queue is read in the effect.
 */
export function useOfflineStatus(): OfflineSnapshot {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot>(getOfflineSnapshot);

  useEffect(() => {
    setSnapshot(getOfflineSnapshot());
    return subscribeOffline(() => setSnapshot(getOfflineSnapshot()));
  }, []);

  return snapshot;
}
