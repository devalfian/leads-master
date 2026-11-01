"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackageEditDialog } from "@/components/guide-data/package-edit-dialog";
import { formatMoney } from "@/lib/guides/currency";
import type { MarketGuide } from "@/lib/guides/types";

/** Package settings: price, starting flag, recommendation, timeline, inclusions. */
export function PackageSettingsList({ guide }: { guide: MarketGuide }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = guide.packages.find((product) => product.id === editingId) ?? null;

  return (
    <section className="rounded-card border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle px-4 py-3">
        <h2 className="text-[15px] font-semibold text-foreground">Packages</h2>
        <p className="text-[12px] text-muted">
          Editing a base price never changes the niche price grid, and vice versa.
        </p>
      </div>

      <ul className="divide-y divide-border-subtle">
        {guide.packages.map((product) => (
          <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13.5px] font-medium text-foreground">
                {product.name}
                {product.isRecommended ? (
                  <Badge tone="accent">
                    <Sparkles aria-hidden="true" className="size-3" />
                    recommended
                  </Badge>
                ) : null}
                {!product.isActive ? <Badge tone="neutral">inactive</Badge> : null}
              </p>
              <p className="text-[12px] text-muted">
                {formatMoney(
                  product.priceAmount,
                  {
                    currencyCode: guide.market.currencyCode,
                    currencyLabel: guide.market.currencyLabel,
                  },
                  { isStartingPrice: product.isStartingPrice },
                )}{" "}
                · {product.timeline} · {product.features.length} inclusions
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setEditingId(product.id)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
          </li>
        ))}
      </ul>

      <p className="border-t border-border-subtle px-4 py-2.5 text-[11px] text-muted">
        Niche-specific prices are edited in the niche pricing table.{" "}
        <Link
          href={`/dashboard/pricing/${guide.market.code}`}
          className="text-accent-soft underline-offset-4 hover:underline"
        >
          Open the pricing library
        </Link>
      </p>

      {editing ? (
        <PackageEditDialog
          product={editing}
          currencyLabel={guide.market.currencyLabel}
          open
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
        />
      ) : null}
    </section>
  );
}