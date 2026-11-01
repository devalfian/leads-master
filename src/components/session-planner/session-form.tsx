"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { ScheduleWarning } from "@/components/shared/schedule-warning";
import { apiPatch, apiPost } from "@/lib/api/client";
import { formatMoney } from "@/lib/guides/currency";
import { formatDateOnly, formatWibRange, isValidDateOnly } from "@/lib/guides/format";
import { activeSchedules, resolveSessionPricing } from "@/lib/guides/pricing";
import type { MarketGuide } from "@/lib/guides/types";

export type SessionFormInitial = {
  id?: string;
  marketCode?: string;
  scheduleId?: string;
  nicheSlug?: string | null;
  sessionDate?: string;
  title?: string;
  objective?: string;
  customNotes?: string;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultTitle(guide: MarketGuide, scheduleTitle: string, nicheName: string | null): string {
  const base = `${guide.market.name} · ${scheduleTitle}${nicheName ? ` · ${nicheName}` : ""}`;
  return base.slice(0, 120);
}

/**
 * Two-step session planner: choose the plan, review exactly what will be saved,
 * then persist it. The server re-reads the guide data on save, so the stored
 * snapshot always comes from the database rather than from this form.
 */
export function SessionForm({
  guides,
  initial,
  mode,
}: {
  guides: MarketGuide[];
  initial?: SessionFormInitial;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const firstGuide = guides[0];
  const initialGuide =
    guides.find((guide) => guide.market.code === initial?.marketCode) ?? firstGuide;
  const initialSchedules = activeSchedules(initialGuide);
  const initialSchedule =
    initialSchedules.find((schedule) => schedule.id === initial?.scheduleId) ?? initialSchedules[0];
  const initialCategory =
    initialGuide.nicheCategories.find((category) => category.slug === initial?.nicheSlug) ?? null;

  const [marketCode, setMarketCode] = useState(initialGuide.market.code);
  const [scheduleId, setScheduleId] = useState(initialSchedule?.id ?? "");
  const [nicheSlug, setNicheSlug] = useState(initialCategory?.slug ?? "");
  const [sessionDate, setSessionDate] = useState(initial?.sessionDate ?? today());
  const [title, setTitle] = useState(
    initial?.title ??
      defaultTitle(initialGuide, initialSchedule?.title ?? "", initialCategory?.name ?? null),
  );
  const [titleEdited, setTitleEdited] = useState(mode === "edit");
  const [objective, setObjective] = useState(
    initial?.objective ?? initialGuide.callObjectives[0]?.goalText ?? "",
  );
  const [notes, setNotes] = useState(initial?.customNotes ?? "");
  const [step, setStep] = useState<"form" | "review">("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const guide = guides.find((entry) => entry.market.code === marketCode) ?? firstGuide;
  const schedules = useMemo(() => activeSchedules(guide), [guide]);
  const schedule = schedules.find((entry) => entry.id === scheduleId) ?? schedules[0] ?? null;
  const category = guide.nicheCategories.find((entry) => entry.slug === nicheSlug) ?? null;
  const pricing = resolveSessionPricing(guide, category);

  function applyMarket(nextCode: string) {
    const nextGuide = guides.find((entry) => entry.market.code === nextCode);
    if (!nextGuide) return;
    const nextSchedules = activeSchedules(nextGuide);
    setMarketCode(nextCode);
    setScheduleId(nextSchedules[0]?.id ?? "");
    setNicheSlug("");
    setObjective(nextGuide.callObjectives[0]?.goalText ?? "");
    if (!titleEdited) setTitle(defaultTitle(nextGuide, nextSchedules[0]?.title ?? "", null));
  }

  function applySchedule(nextId: string) {
    setScheduleId(nextId);
    const nextSchedule = schedules.find((entry) => entry.id === nextId);
    if (!titleEdited && nextSchedule) {
      setTitle(defaultTitle(guide, nextSchedule.title, category?.name ?? null));
    }
  }

  function applyNiche(nextSlug: string) {
    setNicheSlug(nextSlug);
    const nextCategory = guide.nicheCategories.find((entry) => entry.slug === nextSlug) ?? null;
    if (!titleEdited) setTitle(defaultTitle(guide, schedule?.title ?? "", nextCategory?.name ?? null));
  }

  function validate(): string | null {
    if (!schedule) return "Choose a calling schedule for this market.";
    if (!isValidDateOnly(sessionDate)) return "Choose a valid session date.";
    if (!title.trim()) return "Give this session a title.";
    if (!objective.trim()) return "Choose a session objective.";
    return null;
  }

  function goToReview() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setStep("review");
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setError(problem);
      setStep("form");
      return;
    }

    setBusy(true);
    setError(null);
    const payload = {
      marketCode,
      scheduleId,
      nicheSlug: nicheSlug || null,
      sessionDate,
      title: title.trim(),
      objective,
      customNotes: notes,
    };

    const result =
      mode === "edit" && initial?.id
        ? await apiPatch<{ session: { id: string } }>(`/api/sessions/${initial.id}`, payload)
        : await apiPost<{ session: { id: string } }>("/api/sessions", payload);

    if (!result.ok) {
      setBusy(false);
      setError(result.error.message);
      return;
    }

    router.push(`/dashboard/sessions/${result.data.session.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ol className="flex items-center gap-2 text-[12px]">
        <li className={step === "form" ? "text-foreground" : "text-muted"}>1. Plan</li>
        <li className="text-border-subtle">——</li>
        <li className={step === "review" ? "text-foreground" : "text-muted"}>2. Review &amp; save</li>
      </ol>

      {error ? (
        <Alert
          tone="danger"
          title={step === "review" ? "This session was not saved" : "Check the form"}
        >
          {error}
        </Alert>
      ) : null}

      {step === "form" ? (
        <form
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
          onSubmit={(event) => {
            event.preventDefault();
            goToReview();
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Market and schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="session-market">Market</Label>
                <Select
                  id="session-market"
                  value={marketCode}
                  onChange={(event) => applyMarket(event.target.value)}
                >
                  {guides.map((entry) => (
                    <option key={entry.market.code} value={entry.market.code}>
                      {entry.market.name} — {entry.market.currencyCode}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="session-schedule">Calling schedule (WIB)</Label>
                <Select
                  id="session-schedule"
                  value={schedule?.id ?? ""}
                  onChange={(event) => applySchedule(event.target.value)}
                >
                  {schedules.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {formatWibRange(entry.startTimeWib, entry.endTimeWib, entry.timezoneLabel)} ·{" "}
                      {entry.title}
                    </option>
                  ))}
                </Select>
                <FieldHint>
                  Times come from the stored WIB schedule. Changing the session date never shifts them.
                </FieldHint>
              </div>

              {schedule ? (
                <div className="space-y-2 rounded-[10px] border border-border-subtle bg-surface-elevated p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {schedule.cityLabels.map((city) => (
                      <span
                        key={city}
                        className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[11.5px] text-secondary"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted">Priority focus</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {schedule.priorityLabels.map((priority) => (
                        <span
                          key={priority}
                          className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11.5px] text-accent-soft"
                        >
                          {priority}
                        </span>
                      ))}
                    </div>
                  </div>
                  {schedule.localTimeLabel || schedule.timezoneLabel ? (
                    <p className="text-[12px] text-muted">
                      Source local time: {schedule.localTimeLabel ?? "not supplied"}
                      {schedule.timezoneLabel ? ` · ${schedule.timezoneLabel}` : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {guide.market.scheduleNoteReviewRequired ? (
                <ScheduleWarning timezoneNote={guide.market.timezoneNote} />
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="session-niche">Target niche</Label>
                  <Select
                    id="session-niche"
                    value={nicheSlug}
                    onChange={(event) => applyNiche(event.target.value)}
                  >
                    <option value="">Not specified — general session</option>
                    {guide.nicheCategories.map((entry) => (
                      <option key={entry.id} value={entry.slug}>
                        {entry.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="session-date">Session date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={sessionDate}
                    onChange={(event) => setSessionDate(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="session-title">Session title</Label>
                  <Input
                    id="session-title"
                    value={title}
                    onChange={(event) => {
                      setTitleEdited(true);
                      setTitle(event.target.value);
                    }}
                    maxLength={120}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="session-objective">Primary objective</Label>
                  <Select
                    id="session-objective"
                    value={objective}
                    onChange={(event) => setObjective(event.target.value)}
                  >
                    {guide.callObjectives.map((goal) => (
                      <option key={goal.id} value={goal.goalText}>
                        {goal.goalText}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="session-notes">Preparation notes (optional)</Label>
                  <Textarea
                    id="session-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Observations, special requirements, campaign notes"
                    maxLength={2000}
                  />
                  <FieldHint>
                    No prospect name, phone number, email or budget is collected in this phase.
                  </FieldHint>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-2">
              <Button asChild variant="ghost">
                <Link href="/dashboard/sessions">
                  <ArrowLeft aria-hidden="true" />
                  Cancel
                </Link>
              </Button>
              <Button type="submit">
                Review session
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </form>
      ) : null}
      {step === "review" && schedule ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader>
              <CardTitle>Session summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[13px]">
              <Row label="Title" value={title} />
              <Row label="Market" value={`${guide.market.name} (${guide.market.currencyCode})`} />
              <Row label="Date" value={formatDateOnly(sessionDate)} />
              <Row
                label="Calling time"
                value={formatWibRange(
                  schedule.startTimeWib,
                  schedule.endTimeWib,
                  schedule.timezoneLabel,
                )}
              />
              {schedule.localTimeLabel ? (
                <Row label="Source local time" value={schedule.localTimeLabel} />
              ) : null}
              <Row label="Cities / areas" value={schedule.cityLabels.join(", ")} />
              <Row label="Niche" value={category?.name ?? "Not specified"} />
              <Row label="Schedule priorities" value={schedule.priorityLabels.join(", ")} />
              <Row label="Objective" value={objective} />
              {notes.trim() ? <Row label="Notes" value={notes.trim()} /> : null}

              {category ? (
                <div className="rounded-[10px] border border-border-subtle bg-surface-elevated p-3">
                  <p className="text-[11px] uppercase tracking-wider text-muted">Child services</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {category.services.map((service) => (
                      <li
                        key={service.id}
                        className="rounded-full border border-border-subtle bg-background/50 px-2 py-0.5 text-[11.5px] text-secondary"
                      >
                        {service.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-[10px] border border-accent/40 bg-accent/10 p-3">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-accent-soft">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Recommended package
                </p>
                <p className="mt-1 text-[15px] font-semibold text-foreground">
                  {pricing.recommendedPackage?.name ?? "Not configured"}
                </p>
                <p className="text-[20px] font-bold text-foreground">
                  {pricing.amount === null
                    ? "—"
                    : formatMoney(
                        pricing.amount,
                        {
                          currencyCode: guide.market.currencyCode,
                          currencyLabel: guide.market.currencyLabel,
                        },
                        { isStartingPrice: pricing.recommendedPackage?.isStartingPrice ?? false },
                      )}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                  {pricing.priceSource === "niche"
                    ? `Source-guide niche price for ${pricing.nicheLabels.join(", ")}.`
                    : pricing.priceSource === "standard"
                      ? "No niche-specific row was supplied for this niche — the standard package price is shown as a reference."
                      : "This market has no recommended package configured."}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted">All tiers</p>
                <ul className="mt-1 space-y-1">
                  {guide.packages.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-2">
                      <span className="text-secondary">
                        {product.name}
                        {product.id === pricing.recommendedPackage?.id ? (
                          <Badge tone="accent" className="ml-2">
                            recommended
                          </Badge>
                        ) : null}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatMoney(
                          product.priceAmount,
                          {
                            currencyCode: guide.market.currencyCode,
                            currencyLabel: guide.market.currencyLabel,
                          },
                          { isStartingPrice: product.isStartingPrice },
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {guide.market.scheduleNoteReviewRequired ? (
                <ScheduleWarning timezoneNote={guide.market.timezoneNote} />
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Alert tone="info" title="Saving freezes this data">
              The prices, schedule, objective and references above are stored with the session. Later
              edits to the master guide data will not change this saved plan.
            </Alert>

            <div className="flex flex-col gap-2">
              <Button onClick={save} loading={busy}>
                <CheckCircle2 aria-hidden="true" />
                {mode === "edit" ? "Save changes" : "Create session"}
              </Button>
              <Button variant="secondary" onClick={() => setStep("form")} disabled={busy}>
                <ArrowLeft aria-hidden="true" />
                Edit
              </Button>
            </div>

            <p className="text-[11px] leading-relaxed text-muted">
              <CalendarDays className="mr-1 inline size-3" aria-hidden="true" />
              The session appears in Session Planner as soon as the database confirms the save.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border-subtle/60 pb-2 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <span className="text-right text-secondary">{value}</span>
    </div>
  );
}