"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiPost } from "@/lib/api/client";
import { formatMinorUnits } from "@/lib/quotes/money";
import type { QuotePriceDrift } from "@/lib/quotes/types";

/**
 * Draft-only price drift. The saved amounts are left untouched until the user
 * confirms the refresh, so opening an old draft never silently re-prices it.
 */
export function QuotePriceDriftNotice({
  quoteId,
  drift,
  currencyCode,
  currencyLabel,
}: {
  quoteId: string;
  drift: QuotePriceDrift[];
  currencyCode: string;
  currencyLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = { currencyCode, currencyLabel };

  async function refresh(): Promise<string | null> {
    setError(null);
    const result = await apiPost<{ quote: unknown }>(`/api/quotes/${quoteId}/refresh-prices`);
    if (!result.ok) {
      setError(result.error.message);
      return result.error.message;
    }
    router.refresh();
    return null;
  }

  if (drift.length === 0) return null;

  return (
    <div className="print:hidden">
      <Alert tone="warning" title="The pricing catalog has changed since this draft was saved">
        <ul className="space-y-1">
          {drift.map((entry) => (
            <li key={entry.lineItemId}>
              {entry.description}: saved at {formatMinorUnits(entry.savedUnitPriceMinor, currency)}, now{" "}
              {formatMinorUnits(entry.currentUnitPriceMinor, currency)}.
            </li>
          ))}
        </ul>
        <p className="mt-2">
          The draft keeps the amounts above until you confirm an update. A sent quotation is never
          re-priced — duplicate it instead.
        </p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => setOpen(true)}>
          Review and refresh prices
        </Button>
        {error ? <p className="mt-2 text-[12px] text-danger">{error}</p> : null}
      </Alert>

      {open ? (
        <ConfirmDialog
          open
          onOpenChange={setOpen}
          title="Refresh this draft from the current pricing catalog?"
          description="The package lines are re-priced at the amounts currently stored in the Pricing Library, then the totals are recalculated on the server."
          consequence={drift
            .map(
              (entry) =>
                `${entry.description}: ${formatMinorUnits(entry.savedUnitPriceMinor, currency)} → ${formatMinorUnits(entry.currentUnitPriceMinor, currency)}`,
            )
            .join(" · ")}
          confirmLabel="Refresh prices"
          onConfirm={refresh}
        />
      ) : null}
    </div>
  );
}