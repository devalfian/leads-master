import { Check, Pencil, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/guides/currency";
import { findPageCountFeature } from "@/lib/guides/pricing";
import type { Package } from "@/lib/guides/types";

/**
 * One package card. Prices are formatted from the stored integer, and the "+"
 * only appears for a package flagged as a starting price.
 */
export function PackageCard({
  product,
  currencyCode,
  currencyLabel,
  isRecommended,
  onEdit,
}: {
  product: Package;
  currencyCode: string;
  currencyLabel: string;
  isRecommended: boolean;
  onEdit?: () => void;
}) {
  const pageFeature = findPageCountFeature(product.features.map((feature) => feature.featureText));

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-card border bg-surface p-4",
        isRecommended ? "border-accent-soft/60 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]" : "border-border-subtle",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">{product.name}</h3>
          <p className="mt-0.5 text-[12px] text-muted">{product.timeline}</p>
        </div>
        {onEdit ? (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={`Edit ${product.name}`}
            className="print:hidden"
          >
            <Pencil aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold tracking-tight text-foreground">
          {formatMoney(product.priceAmount, { currencyCode, currencyLabel }, {
            isStartingPrice: product.isStartingPrice,
          })}
        </p>
        {product.isStartingPrice ? (
          <p className="mt-0.5 text-[12px] text-secondary">Starting price — final quote depends on scope.</p>
        ) : null}
        {isRecommended ? (
          <Badge tone="accent" className="mt-2">
            <Sparkles aria-hidden="true" className="size-3" />
            Recommended
          </Badge>
        ) : null}
      </div>

      {pageFeature ? (
        <p className="mt-3 rounded-[8px] border border-border-subtle bg-surface-elevated px-2.5 py-1.5 text-[12px] text-secondary">
          {pageFeature}
        </p>
      ) : null}

      <ul className="mt-3 space-y-1.5">
        {product.features.map((feature) => (
          <li key={feature.id} className="flex gap-2 text-[13px] leading-relaxed text-secondary">
            <Check className="mt-0.5 size-3.5 shrink-0 text-accent-soft" aria-hidden="true" />
            <span>{feature.featureText}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}