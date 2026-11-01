"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import {
  CALLBOOK_GOALS,
  CALLBOOK_GOAL_LABELS,
  CALLBOOK_LANGUAGES,
  CALLBOOK_LANGUAGE_LABELS,
  type CallbookGoal,
  type CallbookLanguage,
  type CallbookMarketOption,
} from "@/lib/callbooks/types";
import type { CallbookMetaState } from "./use-callbook-draft";

/**
 * Callbook settings. Market and niche come from the Phase 1 guide data (passed in
 * as plain options); the niche list is scoped to the selected market so a callbook
 * can never point at a niche from another market.
 */
export function CallbookSettingsDialog({
  open,
  onOpenChange,
  meta,
  markets,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: CallbookMetaState;
  markets: CallbookMarketOption[];
  onChange: (patch: Partial<CallbookMetaState>) => void;
}) {
  const selectedMarket = markets.find((market) => market.id === meta.marketId) ?? null;
  const niches = selectedMarket?.niches ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Callbook settings</DialogTitle>
          <DialogDescription>
            Changes go into the draft — use “Save draft” to write them to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-title">Name</Label>
            <Input
              id="settings-title"
              value={meta.title}
              maxLength={120}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-audience">Target audience</Label>
            <Input
              id="settings-audience"
              value={meta.targetAudience}
              maxLength={200}
              placeholder="e.g. Australian contractors"
              onChange={(event) => onChange({ targetAudience: event.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="settings-market">Market</Label>
              <Select
                id="settings-market"
                value={meta.marketId ?? ""}
                onChange={(event) =>
                  // Switching market clears the niche so the pair never drifts apart.
                  onChange({ marketId: event.target.value || null, nicheCategoryId: null })
                }
              >
                <option value="">No market set</option>
                {markets.map((market) => (
                  <option key={market.id} value={market.id}>
                    {market.name} — {market.currencyCode}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="settings-niche">Target niche</Label>
              <Select
                id="settings-niche"
                value={meta.nicheCategoryId ?? ""}
                disabled={!selectedMarket}
                onChange={(event) => onChange({ nicheCategoryId: event.target.value || null })}
              >
                <option value="">No niche set</option>
                {niches.map((niche) => (
                  <option key={niche.id} value={niche.id}>
                    {niche.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-language">Language</Label>
            <Select
              id="settings-language"
              value={meta.language ?? ""}
              onChange={(event) =>
                onChange({ language: (event.target.value || null) as CallbookLanguage | null })
              }
            >
              <option value="">Not set</option>
              {CALLBOOK_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {CALLBOOK_LANGUAGE_LABELS[language]}
                </option>
              ))}
            </Select>
            <FieldHint>
              The language you will speak on the call. Existing Callbooks may have none set.
            </FieldHint>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-goal">Primary goal</Label>
            <Select
              id="settings-goal"
              value={meta.primaryGoal}
              onChange={(event) => onChange({ primaryGoal: event.target.value as CallbookGoal })}
            >
              {CALLBOOK_GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {CALLBOOK_GOAL_LABELS[goal]}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-description">Description</Label>
            <Textarea
              id="settings-description"
              value={meta.description}
              rows={3}
              maxLength={1000}
              placeholder="What this conversation is for."
              onChange={(event) => onChange({ description: event.target.value })}
            />
            <FieldHint>A short reminder of when to use this Callbook.</FieldHint>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-internal-notes">Internal notes</Label>
            <Textarea
              id="settings-internal-notes"
              value={meta.internalNotes}
              rows={3}
              maxLength={4000}
              placeholder="Preparation notes, campaign context, anything only you should see."
              onChange={(event) => onChange({ internalNotes: event.target.value })}
            />
            <FieldHint>Not shown during the call. Kept with the Callbook only.</FieldHint>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}