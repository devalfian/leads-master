import Link from "next/link";
import { CalendarClock, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AutomationRunButton } from "@/components/automation/run-button";
import { RuleCard } from "@/components/automation/rule-card";
import { loadAutomationPageData } from "@/lib/analytics/service";
import { AUTOMATION_RULES, getRuleDefinition, isAutomationRuleKey } from "@/lib/automation/types";
import { describeDataError } from "@/lib/data-error";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Automation" };

const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;

export default async function AutomationPage() {
  let data: Awaited<ReturnType<typeof loadAutomationPageData>> | null = null;
  let error: string | null = null;

  try {
    data = await loadAutomationPageData();
  } catch (loadError) {
    error = describeDataError(loadError, "Automation could not be loaded. Try again.");
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Analytics", href: "/analytics" },
          { label: "Automation" },
        ]}
        title="Automation"
        description="Deterministic rules that surface overdue follow-ups, expiring quotations and leads that need attention. Nothing is changed or sent automatically."
        actions={data ? <AutomationRunButton /> : undefined}
      />

      <div className="space-y-4 px-5 py-6 md:px-8">
        {error || !data ? (
          <Alert tone="danger" title="Automation could not be loaded">
            {error ?? "The automation page could not be prepared."}
          </Alert>
        ) : (
          <>
            <Alert tone="info" title="Rules are evaluated on demand">
              This deployment has no background scheduler configured, so nothing runs while the app is
              closed. An evaluation runs when you press <strong>Run evaluation</strong>, and the
              dashboard recomputes the same recommendations from live records every time it is
              opened. Reminders are in-app only — no email, SMS or WhatsApp message is ever sent.
            </Alert>

            <section>
              <h2 className="text-[15px] font-semibold text-foreground">Rules</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                Each rule reads existing records and raises one reminder per condition. Turning a rule
                off stops it from raising anything, and resolves the reminders it had already opened.
              </p>
              <ul className="mt-3 space-y-3">
                {AUTOMATION_RULES.map((definition) => {
                  const state = data.ruleStates.find((entry) => entry.key === definition.key);
                  if (!state) return null;
                  const alertCount = data.alerts.filter(
                    (alert) => alert.ruleKey === definition.key,
                  ).length;
                  return (
                    <RuleCard
                      key={definition.key}
                      definition={definition}
                      state={state}
                      alertCount={alertCount}
                    />
                  );
                })}
              </ul>
            </section>

            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Open reminders</h2>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                    One row per condition. Re-evaluating with the same data updates the row instead of
                    adding another, and a row resolves when its condition clears.
                  </p>
                </div>
                <Badge tone={data.alerts.length > 0 ? "warning" : "neutral"}>
                  {data.alerts.length} open
                </Badge>
              </div>

              <div className="mt-3">
                {data.alerts.length === 0 ? (
                  <EmptyState
                    icon={CalendarClock}
                    title="No open reminders"
                    description="Nothing matches the enabled rules right now. Run an evaluation after logging calls or sending quotations."
                    actions={
                      <Button asChild variant="secondary">
                        <Link href="/analytics">Open analytics</Link>
                      </Button>
                    }
                  />
                ) : (
                  <ul className="space-y-2">
                    {data.alerts.map((alert) => {
                      const definition = isAutomationRuleKey(alert.ruleKey)
                        ? getRuleDefinition(alert.ruleKey)
                        : null;
                      const href =
                        alert.entityType === "quote"
                          ? `/quotes/${alert.entityId}`
                          : alert.leadId
                            ? `/leads/${alert.leadId}`
                            : "/analytics";
                      return (
                        <li
                          key={alert.id}
                          className="rounded-[10px] border border-border-subtle bg-background/40 p-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={PRIORITY_TONE[alert.priority]}>{alert.priority}</Badge>
                            <span className="text-[12.5px] font-medium text-foreground">
                              {alert.title}
                            </span>
                            {definition ? (
                              <span className="text-[11px] text-muted">{definition.name}</span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-secondary">
                            {alert.message}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="size-3" aria-hidden="true" />
                              first seen {formatDateTime(alert.firstSeenAt)}
                            </span>
                            <Button asChild size="sm" variant="ghost">
                              <Link href={href}>Open record</Link>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>

            <section className="rounded-card border border-border-subtle bg-surface p-4">
              <h2 className="text-[15px] font-semibold text-foreground">Recent evaluations</h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                An execution log of the last five runs. Errors are recorded here rather than hidden.
              </p>

              {data.runs.length === 0 ? (
                <p className="mt-2 text-[12.5px] text-secondary">
                  No evaluation has run yet. Press <strong>Run evaluation</strong> to reconcile the
                  queue with your current records.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-border-subtle text-[11px] uppercase tracking-wider text-muted">
                        <th className="py-2 pr-2 font-medium">Started</th>
                        <th className="px-2 py-2 font-medium">Result</th>
                        <th className="px-2 py-2 text-right font-medium">Rules</th>
                        <th className="px-2 py-2 text-right font-medium">Opened</th>
                        <th className="py-2 pl-2 text-right font-medium">Resolved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.runs.map((run) => (
                        <tr key={run.id} className="border-b border-border-subtle/60 last:border-b-0">
                          <td className="py-2 pr-2 text-secondary">
                            {formatDateTime(run.startedAt)}
                          </td>
                          <td className="px-2 py-2">
                            <Badge tone={run.status === "success" ? "success" : "danger"}>
                              {run.status}
                            </Badge>
                            {run.errorMessage ? (
                              <span className="ml-2 text-[11px] text-danger">
                                {run.errorMessage}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-2 py-2 text-right text-secondary">
                            {run.rulesEvaluated}
                          </td>
                          <td className="px-2 py-2 text-right text-secondary">{run.alertsOpened}</td>
                          <td className="py-2 pl-2 text-right text-secondary">
                            {run.alertsResolved}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-card border border-border-subtle bg-surface/60 p-4">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <Info className="size-3.5 text-accent-soft" aria-hidden="true" />
                What automation never does
              </h2>
              <ul className="mt-2 space-y-1 text-[11.5px] leading-relaxed text-muted">
                <li>• It never calls, emails, messages or otherwise contacts a prospect.</li>
                <li>• It never marks a quotation accepted, rejected or expired.</li>
                <li>• It never changes a lead&apos;s status, owner or next action.</li>
                <li>• It never creates a follow-up date you did not choose.</li>
                <li>• It never queues a lead that is archived or flagged do-not-contact.</li>
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}