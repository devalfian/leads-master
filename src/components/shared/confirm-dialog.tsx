"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Confirmation dialog for destructive actions. The parent supplies the async
 * action and returns an error message (or `null` on success), so the dialog can
 * never close while claiming something was deleted that was not.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequence,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  consequence?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const message = await onConfirm();
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {consequence ? (
          <p className="rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2 text-[12px] leading-relaxed text-secondary">
            {consequence}
          </p>
        ) : null}

        {error ? (
          <Alert tone="danger" className="mt-3" title="That action did not complete">
            {error}
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}