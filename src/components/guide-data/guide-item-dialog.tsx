"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiPatch, apiPost } from "@/lib/api/client";
import type { GuideResource } from "@/lib/guides/repository";

const RESOURCE_COPY: Record<
  GuideResource,
  { title: string; description: string; textLabel: string; secondaryLabel?: string }
> = {
  "call-objectives": {
    title: "Call objective",
    description: "Objectives appear in the Session Planner and in every saved session snapshot.",
    textLabel: "Objective",
  },
  "session-goals": {
    title: "Session goal",
    description: "The Indonesia guide's session goals, shown for reference on the pricing library.",
    textLabel: "Session goal",
  },
  checklist: {
    title: "Discovery checklist item",
    description: "Shown on the saved session preparation page, in order.",
    textLabel: "Checklist item",
  },
  objections: {
    title: "Objection",
    description: "Reference cards only — there is no branching call script in this module.",
    textLabel: "Objection",
    secondaryLabel: "Suggested response",
  },
  tools: {
    title: "Recommended tool",
    description: "Shown on the session preparation page.",
    textLabel: "Tool name",
    secondaryLabel: "Description",
  },
};

/** Creates or edits one reference record (objective, checklist item, objection, tool). */
export function GuideItemDialog({
  resource,
  marketId,
  marketName,
  item,
  open,
  onOpenChange,
}: {
  resource: GuideResource;
  marketId: string;
  marketName: string;
  item?: { id: string; text: string; secondaryText: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const copy = RESOURCE_COPY[resource];
  const [text, setText] = useState(item?.text ?? "");
  const [secondaryText, setSecondaryText] = useState(item?.secondaryText ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);

    const body = { text: text.trim(), secondaryText: secondaryText.trim() };
    const result = item
      ? await apiPatch(`/api/guide-data/${resource}/${item.id}`, body)
      : await apiPost(`/api/guide-data/${resource}`, { marketId, ...body });

    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${copy.title.toLowerCase()}` : `Add ${copy.title.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            {copy.description} · {marketName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`guide-text-${resource}`}>{copy.textLabel}</Label>
            <Textarea
              id={`guide-text-${resource}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-[70px]"
              maxLength={500}
            />
          </div>

          {copy.secondaryLabel ? (
            <div className="space-y-1.5">
              <Label htmlFor={`guide-secondary-${resource}`}>{copy.secondaryLabel}</Label>
              <Textarea
                id={`guide-secondary-${resource}`}
                value={secondaryText}
                onChange={(event) => setSecondaryText(event.target.value)}
                className="min-h-[80px]"
                maxLength={1000}
              />
              {resource === "tools" ? (
                <FieldHint>The source guide leaves this empty for some tools.</FieldHint>
              ) : null}
            </div>
          ) : null}

          {error ? <Alert tone="danger" title="That entry was not saved">{error}</Alert> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            <Check aria-hidden="true" />
            {item ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}