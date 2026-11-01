"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketNoteDialog } from "@/components/guide-data/market-note-dialog";
import type { Market } from "@/lib/guides/types";

/** Market-level schedule note and its verification warning flag. */
export function MarketNoteBar({ market }: { market: Market }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-border-subtle bg-surface p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[13px] font-semibold text-foreground">Schedule note</h2>
          {market.scheduleNoteReviewRequired ? (
            <Badge tone="warning">verification warning shown</Badge>
          ) : (
            <Badge tone="neutral">no warning</Badge>
          )}
        </div>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-secondary">
          {market.timezoneNote ?? "No source note is stored for this market."}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Pencil aria-hidden="true" />
        Edit note
      </Button>

      {open ? (
        <MarketNoteDialog
          market={market}
          open
          onOpenChange={(next) => {
            if (!next) setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}