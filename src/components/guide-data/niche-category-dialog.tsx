"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiDelete, apiPatch, apiPost } from "@/lib/api/client";
import type { NicheCategory } from "@/lib/guides/types";

/** Renames a niche category and manages its source child labels. */
export function NicheCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: NicheCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [newService, setNewService] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function run(action: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    setBusy(true);
    setError(null);
    setSaved(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) {
      setError(result.error?.message ?? "That change was not saved.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function saveName() {
    if (!name.trim()) {
      setError("The niche name cannot be empty.");
      return;
    }
    if (await run(() => apiPatch(`/api/niches/categories/${category.id}`, { name: name.trim() }))) {
      setSaved("Niche name saved.");
    }
  }

  async function addService() {
    if (!newService.trim()) return;
    const ok = await run(() =>
      apiPost(`/api/niches/categories/${category.id}/services`, { name: newService.trim() }),
    );
    if (ok) {
      setNewService("");
      setSaved("Child label added.");
    }
  }

  async function renameService(id: string, value: string) {
    if (await run(() => apiPatch(`/api/niches/services/${id}`, { name: value }))) {
      setSaved("Child label saved.");
    }
  }

  async function removeService(id: string) {
    if (await run(() => apiDelete(`/api/niches/services/${id}`))) {
      setSaved("Child label removed.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit niche category</DialogTitle>
          <DialogDescription>
            Titles and child labels come from the source guide. Niche price rows are edited separately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`cat-${category.id}`}>Category name</Label>
              <Input
                id={`cat-${category.id}`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
                autoComplete="off"
              />
            </div>
            <Button variant="secondary" onClick={saveName} loading={busy}>
              <Check aria-hidden="true" />
              Save
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-secondary">Child labels</p>
            {category.services.length === 0 ? (
              <p className="text-[12px] text-muted">This category has no child labels.</p>
            ) : (
              <ul className="space-y-1.5">
                {category.services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    text={service.name}
                    disabled={busy}
                    onSave={(value) => renameService(service.id, value)}
                    onRemove={() => removeService(service.id)}
                  />
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(event) => setNewService(event.target.value)}
                placeholder="Add a child label"
                maxLength={120}
                autoComplete="off"
              />
              <Button variant="secondary" onClick={addService} disabled={busy || !newService.trim()}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServiceRow({
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
        maxLength={120}
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
        aria-label={`Remove child label: ${text}`}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}