"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GuideItemDialog } from "@/components/guide-data/guide-item-dialog";
import { apiDelete } from "@/lib/api/client";
import type { GuideResource } from "@/lib/guides/repository";

export type ReferenceItem = {
  id: string;
  text: string;
  secondaryText: string;
};

/** Editable list for one guide-data reference collection. */
export function ReferenceSettingsList({
  resource,
  title,
  description,
  marketId,
  marketName,
  items,
}: {
  resource: GuideResource;
  title: string;
  description: string;
  marketId: string;
  marketName: string;
  items: ReferenceItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ReferenceItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReferenceItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(item: ReferenceItem): Promise<string | null> {
    const result = await apiDelete(`/api/guide-data/${resource}/${item.id}`);
    if (!result.ok) return result.error.message;
    router.refresh();
    return null;
  }

  return (
    <section className="rounded-card border border-border-subtle bg-surface">
      <div className="flex items-start justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          <p className="text-[12px] text-muted">{description}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" />
          Add
        </Button>
      </div>

      {error ? (
        <div className="px-4 pt-3">
          <Alert tone="danger" title="That change was not saved">
            {error}
          </Alert>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="px-4 py-3 text-[12.5px] text-muted">
          No entries yet. Sessions created now will not include this section.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] text-foreground">{item.text}</p>
                {item.secondaryText ? (
                  <p className="mt-0.5 text-[12px] leading-relaxed text-secondary">
                    {item.secondaryText}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditing(item)}
                  aria-label={`Edit: ${item.text}`}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(item)}
                  aria-label={`Delete: ${item.text}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <GuideItemDialog
          resource={resource}
          marketId={marketId}
          marketName={marketName}
          open
          onOpenChange={(open) => {
            if (!open) setCreating(false);
          }}
        />
      ) : null}

      {editing ? (
        <GuideItemDialog
          resource={resource}
          marketId={marketId}
          marketName={marketName}
          item={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null);
              setError(null);
            }
          }}
          title="Delete this entry?"
          description={deleteTarget.text}
          consequence="Existing session snapshots keep their copy. New sessions will no longer include it."
          confirmLabel="Delete entry"
          onConfirm={() => remove(deleteTarget)}
        />
      ) : null}
    </section>
  );
}