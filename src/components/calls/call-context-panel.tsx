"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/guides/currency";
import type { CallbookPricingContext } from "@/lib/callbooks/pricing-context-types";

/**
 * Collapsible pricing context for a live call.
 *
 * Read-only by design: prices come from the guide data (or the frozen session
 * snapshot) and the call cannot change them. Every number is shown with its
 * currency, and the source is labelled so a saved-session price is never mistaken
 * for the current master price.
 */
export function CallContextPanel({
  context,
  defaultOpen,
}: {
  context: CallbookPricingContext;
  defaultOpen?: boolean;
}) {
  // A session-launched call opens the panel so the frozen prices are visible
  // immediately; an independent call keeps it collapsed so the script stays
  // dominant.
  const [open, setOpen] = useState(defaultOpen ?? context.source === "session");
  const currency = context.market
    ? { currencyCode: context.market.currencyCode, currencyLabel: context.market.currencyLabel }
    : { currencyCode: "USD", currencyLabel: "" };

  return (
    <section className="rounded-card border border-border-subtle bg-surface print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Tag className="size-3.5 shrink-0 text-accent-soft" aria-hidden="true" />
          <span className="text-[12px] font-medium text-foreground">Call context</span>
          {context.market ? (
            <span className="truncate text-[11.5px] text-muted">
              {context.market.name}
              {context.niche.name ? ` · ${context.niche.name}` : ""}
            </span>
          ) : (
            <span className="text-[11.5px] text-muted">No market set</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={context.source === "session" ? "info" : "neutral"}>
            {context.sourceLabel}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setOpen((current) => !current)}>
            {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            {open ? "Hide" : "Show"}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border-subtle px-4 py-3">
          {context.note ? (
            <p className="flex gap-2 rounded-[10px] border border-warning/30 bg-warning/10 px-3 py-2 text-[11.5px] leading-relaxed text-warning">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {context.note}
            </p>
          ) : null}

          {context.packages.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-secondary">
              No package references are available for this Callbook yet.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {context.packages.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[10px] border border-border-subtle bg-background/50 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-foreground">
                      {product.name}
                      {product.id === context.recommendedPackageId ? (
                        <Badge tone="accent" className="ml-2">
                          recommended
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-[13px] font-semibold text-foreground">
                      {formatMoney(product.priceAmount, currency, {
                        isStartingPrice: product.isStartingPrice,
                      })}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted">{product.timeline}</p>
                  {product.features.length > 0 ? (
                    <p className="mt-1 text-[11px] leading-relaxed text-secondary">
                      {product.features.slice(0, 4).join(" · ")}
                      {product.features.length > 4 ? ` · +${product.features.length - 4} more` : ""}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {context.specialtyRows.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                Supplied niche price rows
              </p>
              {context.specialtyRows.map((group) => (
                <div
                  key={group.label}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-border-subtle bg-background/40 px-3 py-1.5"
                >
                  <span className="text-[11.5px] text-secondary">{group.label}</span>
                  <span className="flex flex-wrap gap-2 text-[11.5px] text-foreground">
                    {group.prices.map((price) => (
                      <span key={price.packageId}>
                        {price.packageName}{" "}
                        <span className="font-medium">
                          {formatMoney(price.priceAmount, currency)}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <p className="text-[10.5px] leading-relaxed text-muted">
            Source-guide references only — not a quote. Change prices in the pricing library.
          </p>
        </div>
      ) : null}
    </section>
  );
}