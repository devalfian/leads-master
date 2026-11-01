"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPatch } from "@/lib/api/client";
import type { Market } from "@/lib/guides/types";

/**
 * Edits the market-level schedule note and whether the UI must warn about it.
 * The note is free text from the source guide; clearing the flag does not change
 * any stored time.
 */
export function MarketNoteDialog({
  market,
  open,
  onOpenChange,
}: {
  market: Market;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [timezoneNote, setNote] = useState(market.timezoneNote ?? "");
  const [reviewRequired, setReviewRequired] = useState(market.scheduleNoteReviewRequired);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);
    const result = await apiPatch(`/api/markets/${market.id}`, {
      timezoneNote: timezoneNote.trim() ? timezoneNote.trim() : null,
      scheduleNoteReviewRequired: reviewRequired,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSaved("Schedule note saved.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{market.name} schedule note</DialogTitle>
          <DialogDescription>
            The note is shown verbatim. The warning flag only controls whether the verification banner
            appears for this market.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`market-note-${market.id}`}>Source schedule note</Label>
            <Textarea
              id={`market-note-${market.id}`}
              value={timezoneNote}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-[110px]"
              maxLength={1000}
            />
            <FieldHint>Leave empty for markets whose guide has no note.</FieldHint>
          </div>

          <label className="flex items-start gap-2 text-[13px] text-secondary">
            <input
              type="checkbox"
              checked={reviewRequired}
              onChange={(event) => setReviewRequired(event.target.checked)}
              className="mt-0.5"
            />
            Show the “schedule requires timezone verification” warning
          </label>

          {error ? <Alert tone="danger" title="The note was not saved">{error}</Alert> : null}
          {saved ? <Alert tone="success" title={saved} /> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={save} loading={busy}>
            <Check aria-hidden="true" />
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}