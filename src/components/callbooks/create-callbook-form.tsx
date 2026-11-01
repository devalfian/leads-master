"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilePlus2, LayoutTemplate, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label, Select } from "@/components/ui/field";
import { apiPost } from "@/lib/api/client";
import {
  CALLBOOK_GOALS,
  CALLBOOK_GOAL_LABELS,
  CALLBOOK_LANGUAGES,
  CALLBOOK_LANGUAGE_LABELS,
  type Callbook,
  type CallbookGoal,
  type CallbookLanguage,
  type CallbookMarketOption,
} from "@/lib/callbooks/types";
import { cn, pluralise } from "@/lib/utils";

export type TemplateCard = {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  primaryGoal: CallbookGoal;
  guidance: string;
  marketCode: string | null;
  nicheName: string | null;
  summary: {
    nodeCount: number;
    outcomeCount: number;
    branchCount: number;
    startTitle: string;
    outcomeLabels: string[];
  };
};

function templateMarketId(
  template: TemplateCard | null,
  markets: CallbookMarketOption[],
): string | null {
  if (!template?.marketCode) return null;
  return markets.find((market) => market.code === template.marketCode)?.id ?? null;
}

function templateNicheId(
  template: TemplateCard | null,
  markets: CallbookMarketOption[],
): string | null {
  if (!template?.nicheName) return null;
  const market = markets.find((entry) => entry.id === templateMarketId(template, markets));
  if (!market) return null;
  return market.niches.find((niche) => niche.name === template.nicheName)?.id ?? null;
}

type Method = "scratch" | "template";

export function CreateCallbookForm({
  templates,
  markets,
  initialMethod,
}: {
  templates: TemplateCard[];
  markets: CallbookMarketOption[];
  initialMethod: Method;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>(initialMethod);
  const [templateId, setTemplateId] = useState<string | null>(
    initialMethod === "template" ? (templates[0]?.id ?? null) : null,
  );
  const [title, setTitle] = useState(
    initialMethod === "template" ? (templates[0]?.name ?? "") : "",
  );
  const [targetAudience, setTargetAudience] = useState(
    initialMethod === "template" ? (templates[0]?.targetAudience ?? "") : "",
  );
  const [primaryGoal, setPrimaryGoal] = useState<CallbookGoal>(
    initialMethod === "template" ? (templates[0]?.primaryGoal ?? "book_meeting") : "book_meeting",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const initialTemplate =
    initialMethod === "template" ? (templates[0] ?? null) : null;
  const [marketId, setMarketId] = useState<string | null>(() =>
    templateMarketId(initialTemplate, markets),
  );
  const [nicheCategoryId, setNicheCategoryId] = useState<string | null>(() =>
    templateNicheId(initialTemplate, markets),
  );
  const [language, setLanguage] = useState<CallbookLanguage | null>(null);

  const selectedTemplate = templates.find((template) => template.id === templateId) ?? null;
  const selectedMarket = markets.find((market) => market.id === marketId) ?? null;
  const niches = selectedMarket?.niches ?? [];

  function chooseMethod(next: Method) {
    setMethod(next);
    if (next === "template" && !templateId && templates[0]) applyTemplate(templates[0]);
  }

  function applyTemplate(template: TemplateCard) {
    setTemplateId(template.id);
    if (!title.trim()) setTitle(template.name);
    if (!targetAudience.trim()) setTargetAudience(template.targetAudience);
    setPrimaryGoal(template.primaryGoal);

    // Templates may declare their market/niche; resolve them against the guide
    // data instead of hardcoding ids in the template files.
    setMarketId(templateMarketId(template, markets));
    setNicheCategoryId(templateNicheId(template, markets));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Give your Callbook a name.");
      return;
    }
    if (method === "template" && !templateId) {
      setError("Choose a template, or switch to starting from scratch.");
      return;
    }

    setSubmitting(true);
    const result = await apiPost<{ callbook: Callbook }>("/api/callbooks", {
      title: title.trim(),
      targetAudience: targetAudience.trim() || undefined,
      primaryGoal,
      templateId: method === "template" ? templateId : null,
      marketId,
      nicheCategoryId,
      language,
    });

    if (!result.ok) {
      setError(result.error.message);
      setSubmitting(false);
      return;
    }

    router.push(`/callbooks/${result.data.callbook.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="rounded-card border border-border-subtle bg-surface p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="callbook-title">
              Callbook name <span className="text-danger">*</span>
            </Label>
            <Input
              id="callbook-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Contractor Website Outreach"
              maxLength={120}
              required
              aria-required="true"
            />
            <FieldHint>Name it after the conversation, not the prospect.</FieldHint>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="target-audience">Target audience</Label>
              <Input
                id="target-audience"
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
                placeholder="e.g. Australian contractors"
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="primary-goal">Primary goal</Label>
              <Select
                id="primary-goal"
                value={primaryGoal}
                onChange={(event) => setPrimaryGoal(event.target.value as CallbookGoal)}
              >
                {CALLBOOK_GOALS.map((goal) => (
                  <option key={goal} value={goal}>
                    {CALLBOOK_GOAL_LABELS[goal]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="callbook-market">Market</Label>
              <Select
                id="callbook-market"
                value={marketId ?? ""}
                onChange={(event) => {
                  setMarketId(event.target.value || null);
                  setNicheCategoryId(null);
                }}
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
              <Label htmlFor="callbook-niche">Target niche</Label>
              <Select
                id="callbook-niche"
                value={nicheCategoryId ?? ""}
                disabled={!selectedMarket}
                onChange={(event) => setNicheCategoryId(event.target.value || null)}
              >
                <option value="">No niche set</option>
                {niches.map((niche) => (
                  <option key={niche.id} value={niche.id}>
                    {niche.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="callbook-language">Language</Label>
              <Select
                id="callbook-language"
                value={language ?? ""}
                onChange={(event) =>
                  setLanguage((event.target.value || null) as CallbookLanguage | null)
                }
              >
                <option value="">Not set</option>
                {CALLBOOK_LANGUAGES.map((entry) => (
                  <option key={entry} value={entry}>
                    {CALLBOOK_LANGUAGE_LABELS[entry]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <FieldHint>
            Market and niche come from the pricing guide data, so live calls can show the matching
            packages. You can change them later in the builder.
          </FieldHint>
        </div>
      </div>

      <fieldset className="rounded-card border border-border-subtle bg-surface p-5">
        <legend className="px-1 text-[13px] font-medium text-secondary">Starting method</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <MethodOption
            checked={method === "scratch"}
            onSelect={() => chooseMethod("scratch")}
            icon={<FilePlus2 className="size-4" aria-hidden="true" />}
            title="Start from scratch"
            description="Opens the builder with a single message step marked as the start."
          />
          <MethodOption
            checked={method === "template"}
            onSelect={() => chooseMethod("template")}
            icon={<LayoutTemplate className="size-4" aria-hidden="true" />}
            title="Use a template"
            description="Copy an editable example conversation, then change anything you like."
          />
        </div>
      </fieldset>

      {method === "template" ? (
        <div className="space-y-3">
          <h2 className="text-[13px] font-medium text-secondary">Choose a template</h2>
          <div className="grid gap-3">
            {templates.map((template) => {
              const active = template.id === templateId;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-card border p-4 text-left transition-colors duration-150",
                    active
                      ? "border-accent bg-accent/10"
                      : "border-border-subtle bg-surface hover:border-accent-soft/50",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-medium text-foreground">{template.name}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                        active
                          ? "border-accent/50 text-accent-soft"
                          : "border-border-subtle text-muted",
                      )}
                    >
                      {CALLBOOK_GOAL_LABELS[template.primaryGoal]}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                    {template.description}
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    {pluralise(template.summary.nodeCount, "step")} ·{" "}
                    {pluralise(template.summary.branchCount, "response")} ·{" "}
                    {pluralise(template.summary.outcomeCount, "outcome")} · starts at &ldquo;
                    {template.summary.startTitle}&rdquo;
                  </p>
                  {active ? (
                    <div className="mt-3 rounded-[10px] border border-border-subtle bg-background/50 p-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Structure
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                        {template.guidance}
                      </p>
                      <p className="mt-2 text-[12px] text-secondary">
                        <span className="text-muted">Outcomes: </span>
                        {template.summary.outcomeLabels.join(" · ")}
                      </p>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Templates are example material, not guaranteed scripts. They are copied into a new,
            independent Callbook — editing it never changes the template.
          </p>
        </div>
      ) : null}

      {error ? <Alert tone="danger" title="The Callbook was not created">{error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={submitting} size="lg">
          Create Callbook
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/callbooks">Cancel</Link>
        </Button>
        {method === "template" && selectedTemplate ? (
          <span className="text-[12px] text-muted">
            Based on &ldquo;{selectedTemplate.name}&rdquo;
          </span>
        ) : null}
      </div>
    </form>
  );
}

function MethodOption({
  checked,
  onSelect,
  icon,
  title,
  description,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-[10px] border p-3.5 transition-colors duration-150",
        checked
          ? "border-accent bg-accent/10"
          : "border-border-subtle bg-surface hover:border-accent-soft/50",
      )}
    >
      <input
        type="radio"
        name="starting-method"
        className="mt-0.5 size-4 accent-[#7c3aed]"
        checked={checked}
        onChange={onSelect}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          {icon}
          {title}
        </span>
        <span className="mt-1 block text-[12px] leading-relaxed text-secondary">{description}</span>
      </span>
    </label>
  );
}