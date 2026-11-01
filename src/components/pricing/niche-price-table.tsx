"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { NichePriceDialog } from "@/components/guide-data/niche-price-dialog";
import { formatMoney } from "@/lib/guides/currency";
import { groupNichePriceRows } from "@/lib/guides/pricing";
import type { MarketGuide } from "@/lib/guides/types";

/**
 * Searchable niche-price grid. Only the package columns the source guide
 * actually supplies are shown — the custom tiers have no niche rows and are
 * deliberately absent.
 */
export function NichePriceTable({ guide }: { guide: MarketGuide }) {
  const [query, setQuery] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  const groups = useMemo(
    () => groupNichePriceRows(guide.nichePriceRows, guide.packages),
    [guide.nichePriceRows, guide.packages],
  );

  const columns = useMemo(() => {
    const ids = new Set(guide.nichePriceRows.map((row) => row.packageId));
    return guide.packages.filter((product) => ids.has(product.id));
  }, [guide.nichePriceRows, guide.packages]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups.filter((group) => group.label.toLowerCase().includes(needle));
  }, [groups, query]);

  const editingRows = editingLabel
    ? guide.nichePriceRows.filter((row) => row.nicheLabel === editingLabel)
    : [];

  return (
    <section className="rounded-card border border-border-subtle bg-surface">
      <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Niche pricing</h2>
          <p className="text-[12px] text-muted">
            {groups.length} source rows for {guide.market.name} · prices in{" "}
            {guide.market.currencyCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search niches"
              className="h-8 w-48 pl-8 text-[13px]"
              aria-label="Search niche pricing"
            />
          </div>
          <span className="text-[11px] text-muted">{visible.length} shown</span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={SearchX}
            title="No niche matches that search"
            description="Try a shorter search term, or clear the search to see every supplied niche row."
            actions={
              <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Niche
                </th>
                {columns.map((product) => (
                  <th key={product.id} scope="col" className="px-4 py-2.5 font-medium">
                    {product.name}
                  </th>
                ))}
                <th scope="col" className="px-4 py-2.5 text-right font-medium print:hidden">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((group) => (
                <tr key={group.label} className="border-b border-border-subtle/60 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-[13px] font-medium text-foreground">
                    {group.label}
                  </th>
                  {columns.map((product) => {
                    const supplied = group.prices.find((price) => price.packageId === product.id);
                    const isSpecialty = Boolean(
                      supplied && supplied.priceAmount !== product.priceAmount,
                    );
                    return (
                      <td key={product.id} className="px-4 py-2.5 text-[13px] text-secondary">
                        {supplied ? (
                          <span className="flex items-center gap-2">
                            {formatMoney(supplied.priceAmount, {
                              currencyCode: guide.market.currencyCode,
                              currencyLabel: guide.market.currencyLabel,
                            })}
                            {isSpecialty ? (
                              <Badge tone="warning" className="px-1.5 py-0 text-[10px]">
                                niche
                              </Badge>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-muted">Not supplied</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-2.5 text-right print:hidden">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditingLabel(group.label)}
                      aria-label={`Edit niche prices for ${group.label}`}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingLabel ? (
        <NichePriceDialog
          label={editingLabel}
          rows={editingRows}
          packages={guide.packages}
          currencyCode={guide.market.currencyCode}
          currencyLabel={guide.market.currencyLabel}
          open
          onOpenChange={(open) => {
            if (!open) setEditingLabel(null);
          }}
        />
      ) : null}
    </section>
  );
}