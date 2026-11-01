"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPatch } from "@/lib/api/client";
import { formatMoney, parseAmountInput } from "@/lib/guides/currency";
import type { NichePriceRow, Package } from "@/lib/guides/types";

/**
 * Edits one row of the niche-price grid. Each cell is its own record, so a
 * specialty price can differ from the package base price (the US Law Firm and
 * Accounting / Consulting rows do exactly that).
 */
export function NichePriceDialog({
  label,
  rows,
  packages,
  currencyCode,
  currencyLabel,
  open,
  onOpenChange,
}: {
  label: string;
  rows: NichePriceRow[];
  packages: Package[];
  currencyCode: string;
  currencyLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, String(row.priceAmount)])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(null);

    for (const row of rows) {
      const amount = parseAmountInput(values[row.id] ?? "");
      if (amount === null) {
        setError("Enter a digit-only amount for every column.");
        setBusy(false);
        return;
      }
      if (amount === row.priceAmount) continue;

      const result = await apiPatch(`/api/pricing/niche-rows/${row.id}`, { priceAmount: amount });
      if (!result.ok) {
        setError(result.error.message);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    setSaved("Niche prices saved.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            These are the source guide&apos;s niche-specific prices. They are stored separately from
            each package&apos;s base price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {rows.map((row) => {
            const product = packages.find((entry) => entry.id === row.packageId);
            return (
              <div key={row.id} className="space-y-1.5">
                <Label htmlFor={`npr-${row.id}`}>
                  {product?.name ?? "Package"} ({currencyLabel})
                </Label>
                <Input
                  id={`npr-${row.id}`}
                  value={values[row.id] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [row.id]: event.target.value }))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                />
                <FieldHint>
                  Standard package price:{" "}
                  {product
                    ? formatMoney(product.priceAmount, {
                        currencyCode,
                        currencyLabel,
                      })
                    : "—"}
                </FieldHint>
              </div>
            );
          })}

          {error ? <Alert tone="danger" title="Those prices were not saved">{error}</Alert> : null}
          {saved ? <Alert tone="success" title={saved} /> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            <Check aria-hidden="true" />
            Save prices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}