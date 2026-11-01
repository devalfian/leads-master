"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { NicheCategoryDialog } from "@/components/guide-data/niche-category-dialog";
import type { NicheCategory } from "@/lib/guides/types";

/** Searchable niche catalog: category titles plus their source child labels. */
export function NicheCatalog({ categories }: { categories: NicheCategory[] }) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(needle) ||
        category.services.some((service) => service.name.toLowerCase().includes(needle)),
    );
  }, [categories, query]);

  const editing = categories.find((category) => category.id === editingId) ?? null;

  return (
    <section className="rounded-card border border-border-subtle bg-surface">
      <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">Niche catalog</h2>
          <p className="text-[12px] text-muted">
            {categories.length} categories ·{" "}
            {categories.reduce((total, category) => total + category.services.length, 0)} child labels
          </p>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories or labels"
            className="h-8 w-60 pl-8 text-[13px]"
            aria-label="Search niche catalog"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={SearchX}
            title="No niche category matches"
            description="Search covers both the category title and every child label."
            actions={
              <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((category) => (
            <li
              key={category.id}
              className="rounded-[12px] border border-border-subtle bg-surface-elevated p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[14px] font-semibold text-foreground">{category.name}</h3>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditingId(category.id)}
                  aria-label={`Edit ${category.name}`}
                  className="print:hidden"
                >
                  <Pencil aria-hidden="true" />
                </Button>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {category.services.map((service) => (
                  <li
                    key={service.id}
                    className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[11.5px] text-secondary"
                  >
                    {service.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <NicheCategoryDialog
          category={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
        />
      ) : null}
    </section>
  );
}