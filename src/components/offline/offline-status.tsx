"use client";

import { useState } from "react";
import { CloudUpload, RotateCcw, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { discardQueued, retryQueued, syncNow } from "@/lib/offline/client";
import { useOfflineStatus } from "@/lib/offline/use-offline";
import { cn, pluralise } from "@/lib/utils";

/**
 * The single place the workspace says what has not reached the server.
 *
 * It stays silent when everything is synced, so the bar only ever appears when
 * it has something to report: no connection, a change waiting, or a change the
 * server refused.
 */
export function OfflineStatusBar() {
  const { online, syncing, pending, failed } = useOfflineStatus();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(id: string, action: (id: string) => Promise<void>) {
    setBusy(id);
    try {
      await action(id);
    } finally {
      setBusy(null);
    }
  }

  if (failed.length > 0) {
    return (
      <Alert
        tone="danger"
        title={`${pluralise(failed.length, "change")} could not be synced`}
        className="sticky top-0 z-30 mx-5 mt-4 md:mx-8"
        actions={
          <Button size="sm" variant="secondary" onClick={() => void syncNow()} loading={syncing}>
            <CloudUpload aria-hidden="true" />
            Try again
          </Button>
        }
      >
        <p>The server refused these, so they are still only on this device.</p>
        <ul className="mt-2 space-y-1.5">
          {failed.map((record) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-background/50 px-2.5 py-1.5"
            >
              <span className="min-w-0">
                <span className="block text-[12px] font-medium">{record.label}</span>
                <span className="block text-[11px] opacity-80">
                  {record.lastError ?? "The server did not accept this change."}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Retry ${record.label}`}
                  loading={busy === record.id}
                  onClick={() => void run(record.id, retryQueued)}
                >
                  <RotateCcw aria-hidden="true" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Discard ${record.label}`}
                  onClick={() => void run(record.id, discardQueued)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </Alert>
    );
  }

  if (!online) {
    return (
      <Alert
        tone="warning"
        title="You are offline"
        className="mx-5 mt-4 md:mx-8"
        actions={
          pending.length > 0 ? (
            <Button size="sm" variant="secondary" onClick={() => void syncNow()} disabled>
              <CloudUpload aria-hidden="true" />
              Sync now
            </Button>
          ) : undefined
        }
      >
        {pending.length > 0
          ? `${pluralise(pending.length, "change")} saved on this device. They are sent automatically when the connection returns.`
          : "Pages you have already opened still work. New changes are saved on this device and sent when the connection returns."}
      </Alert>
    );
  }

  if (pending.length > 0 || syncing) {
    return (
      <Alert
        tone="info"
        title={syncing ? "Sending your changes…" : `${pluralise(pending.length, "change")} waiting to sync`}
        className="mx-5 mt-4 md:mx-8"
        actions={
          <Button size="sm" variant="secondary" onClick={() => void syncNow()} loading={syncing}>
            <CloudUpload aria-hidden="true" />
            Sync now
          </Button>
        }
      >
        These were made while you were offline and are being sent to the server now.
      </Alert>
    );
  }

  return null;
}

/**
 * Compact connection state for the sidebar footer.
 *
 * On a phone the sidebar is a horizontal strip, so this is hidden there and the
 * bar above the content carries the message instead.
 */
export function OfflineStatusPill() {
  const { online, syncing, pending, failed } = useOfflineStatus();
  const waiting = pending.length + failed.length;

  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
          <span
            aria-hidden="true"
            className={cn("size-1.5 rounded-full", online ? "bg-success" : "bg-warning")}
          />
          {online ? "Online" : "Offline"}
        </p>
        {waiting > 0 ? (
          <Badge tone={failed.length > 0 ? "danger" : "warning"}>{waiting} waiting</Badge>
        ) : null}
      </div>

      <p className="mt-1.5 text-xs leading-relaxed text-secondary">
        {failed.length > 0
          ? `${pluralise(failed.length, "change")} needs your attention before it can reach the server.`
          : pending.length > 0
            ? `${pluralise(pending.length, "change")} saved on this device.`
            : online
              ? "Changes are saved to the server as you make them."
              : "Changes are saved on this device until the connection returns."}
      </p>

      {online && pending.length > 0 ? (
        <Button
          size="sm"
          variant="secondary"
          className="mt-2 w-full"
          loading={syncing}
          onClick={() => void syncNow()}
        >
          <CloudUpload aria-hidden="true" />
          Sync now
        </Button>
      ) : null}
    </div>
  );
}
