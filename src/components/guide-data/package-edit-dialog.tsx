"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
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
import { apiDelete, apiPatch, apiPost } from "@/lib/api/client";
import { parseAmountInput } from "@/lib/guides/currency";
import type { Package } from "@/lib/guides/types";

/**
 * Edits one package: its own base price, starting-price flag, timeline,
 * recommendation and each inclusion separately. Niche-specific prices are not
 * touched here — they are managed on their own row.
 */
export function PackageEditDialog({
  product,
  currencyLabel,
  open,
  onOpenChange,
}: {
  product: Package;
  currencyLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [price, setPrice] = useState(String(product.priceAmount));
  const [timeline, setTimeline] = useState(product.timeline);
  const [isStartingPrice, setStartingPrice] = useState(product.isStartingPrice);
  const [isRecommended, setRecommended] = useState(product.isRecommended);
  const [newFeature, setNewFeature] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function savePackage() {
    const amount = parseAmountInput(price);
    if (amount === null) {
      setError("Enter the price in the market's currency using digits.");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);

    const result = await apiPatch(`/api/pricing/packages/${product.id}`, {
      priceAmount: amount,
      timeline: timeline.trim(),
      isStartingPrice,
      isRecommended,
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setSaved("Package saved.");
    router.refresh();
  }

  async function addFeature() {
    if (!newFeature.trim()) return;
    setBusy(true);
    setError(null);
    const result = await apiPost(`/api/pricing/packages/${product.id}/features`, {
      featureText: newFeature.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setNewFeature("");
    router.refresh();
  }

  async function renameFeature(id: string, featureText: string) {
    setBusy(true);
    setError(null);
    const result = await apiPatch(`/api/pricing/features/${id}`, { featureText });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  async function removeFeature(id: string) {
    setBusy(true);
    setError(null);
    const result = await apiDelete(`/api/pricing/features/${id}`);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            Base package price only. The niche price grid is edited separately, so this change cannot
            overwrite a specialty price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`price-${product.id}`}>Price ({currencyLabel})</Label>
              <Input
                id={`price-${product.id}`}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="numeric"
                autoComplete="off"
              />
              <FieldHint>
                Whole amount in the market&apos;s currency. No conversion is applied.
              </FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`timeline-${product.id}`}>Timeline</Label>
              <Input
                id={`timeline-${product.id}`}
                value={timeline}
                onChange={(event) => setTimeline(event.target.value)}
                autoComplete="off"
              />
              <FieldHint>Keep the wording used in the source guide.</FieldHint>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 rounded-[10px] border border-border-subtle bg-surface-elevated px-3 py-2.5">
            <label className="flex items-center gap-2 text-[13px] text-secondary">
              <input
                type="checkbox"
                checked={isStartingPrice}
                onChange={(event) => setStartingPrice(event.target.checked)}
              />
              Starting price (shows “+”)
            </label>
            <label className="flex items-center gap-2 text-[13px] text-secondary">
              <input
                type="checkbox"
                checked={isRecommended}
                onChange={(event) => setRecommended(event.target.checked)}
              />
              Recommended for this market
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-secondary">Inclusions</p>
            {product.features.length === 0 ? (
              <p className="text-[12px] text-muted">No inclusions recorded for this package yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {product.features.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    text={feature.featureText}
                    disabled={busy}
                    onSave={(text) => renameFeature(feature.id, text)}
                    onRemove={() => removeFeature(feature.id)}
                  />
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(event) => setNewFeature(event.target.value)}
                placeholder="Add an inclusion"
                maxLength={300}
                autoComplete="off"
              />
              <Button
                variant="secondary"
                onClick={addFeature}
                disabled={busy || !newFeature.trim()}
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
            </div>
          </div>

          {error ? <Alert tone="danger" title="That change was not saved">{error}</Alert> : null}
          {saved ? <Alert tone="success" title={saved} /> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={savePackage} loading={busy}>
            <Check aria-hidden="true" />
            Save package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeatureRow({
  text,
  disabled,
  onSave,
  onRemove,
}: {
  text: string;
  disabled: boolean;
  onSave: (value: string) => void;
  onRemove: () => void;
}) {
  const [value, setValue] = useState(text);
  const dirty = value.trim() !== text && value.trim().length > 0;

  return (
    <li className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={300}
        autoComplete="off"
        className="h-8 text-[13px]"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => onSave(value.trim())}
        disabled={disabled || !dirty}
      >
        Save
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove inclusion: ${text}`}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}