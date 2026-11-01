import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SeedValidationReport } from "@/lib/guides/types";

/**
 * The explicit seed-validation report: totals plus every check, evaluated
 * against the live database. The same function powers the automated tests.
 */
export function SeedValidationPanel({ report }: { report: SeedValidationReport }) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-foreground">Seed validation</h2>
          <Badge tone={report.ok ? "success" : "danger"}>
            {report.ok ? "all checks pass" : "attention needed"}
          </Badge>
        </div>
        <p className="text-[11px] text-muted">Evaluated against the live database on each load.</p>
      </div>

      <dl className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4 xl:grid-cols-7">
        <Total label="Markets" value={report.totals.markets} />
        <Total label="Schedules" value={report.totals.schedules} />
        <Total label="Packages" value={report.totals.packages} />
        <Total label="Inclusions" value={report.totals.packageFeatures} />
        <Total label="Niches" value={report.totals.nicheCategories} />
        <Total label="Niche rows" value={report.totals.nichePriceLabels} />
        <Total label="Niche prices" value={report.totals.nichePriceRows} />
      </dl>

      <ul className="max-h-64 space-y-1 overflow-y-auto border-t border-border-subtle px-4 py-3">
        {report.checks.map((check) => (
          <li key={check.label} className="flex items-start gap-2 text-[12px]">
            {check.ok ? (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
            )}
            <span className="text-secondary">
              <span className="text-foreground">{check.label}</span>
              {" — expected "}
              {check.expected}
              {check.ok ? "" : `, found ${check.actual}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
      <dt className="text-[10.5px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="text-[15px] font-semibold text-foreground">{value}</dd>
    </div>
  );
}