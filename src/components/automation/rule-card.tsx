"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Tags } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { apiPatch } from "@/lib/api/client";
import type { AutomationRuleDefinition, RuleState } from "@/lib/automation/types";

const PRIORITY_TONE = { high: "danger", medium: "warning", low: "neutral" } as const;

/**
 * One rule: what it does, when it fires, whether it is on, and its window.
 *
 * Turning a rule off is a real change: the next evaluation skips it and any
 * reminders it had opened are resolved. The card says so, because a toggle that
 * only hid rows would be a lie.
 */
export function RuleCard({
  definition,
  state,
  alertCount,
}: {
  definition: AutomationRuleDefinition;
  state: RuleState;
  alertCount: number;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(state.enabled);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      definition.configFields.map((field) => [
        field.key,
        String(state.config[field.key] ?? field.defaultValue),
      ]),
    ),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function persist(
    patch: { enabled?: boolean; config?: Record<string, number> },
    label: string,
  ): Promise<boolean> {
    setBusy(label);
    setError(null);
    setNotice(null);

    const result = await apiPatch<{ rule: RuleState }>(
      `/api/automation/rules/${definition.key}`,
      patch,
    );
    setBusy(null);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    setNotice(label === "toggle" ? "Rule setting saved." : "Rule configuration saved.");
    router.refresh();
    return true;
  }

  async function toggle() {
    const next = !enabled;
    const saved = await persist({ enabled: next }, "toggle");
    if (saved) setEnabled(next);
  }

  async function saveConfig() {
    const config: Record<string, number> = {};
    for (const field of definition.configFields) {
      const parsed = Number(values[field.key]);
      config[field.key] = Number.isFinite(parsed) ? Math.round(parsed) : field.defaultValue;
    }
    await persist({ config }, "config");
  }
return (
    <li className="rounded-card border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-foreground">{definition.name}</h3>
            <Badge tone={PRIORITY_TONE[definition.priority]}>{definition.priority} priority</Badge>
            <Badge tone={enabled ? "success" : "neutral"}>{enabled ? "Enabled" : "Disabled"}</Badge>
            {alertCount > 0 ? <Badge tone="accent">{alertCount} open</Badge> : null}
          </div>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-secondary">
            {definition.description}
          </p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">{definition.trigger}</p>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] text-secondary">
          <input
            type="checkbox"
            className="size-4 accent-accent"
            checked={enabled}
            disabled={busy !== null}
            onChange={() => void toggle()}
            aria-label={`Enable ${definition.name}`}
          />
          {busy === "toggle" ? "Saving…" : "Enabled"}
        </label>
      </div>

      {definition.configFields.length > 0 ? (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
            <Tags className="size-3.5" aria-hidden="true" />
            Settings
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            {definition.configFields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`${definition.key}-${field.key}`}>{field.label}</Label>
                <Input
                  id={`${definition.key}-${field.key}`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  value={values[field.key] ?? String(field.defaultValue)}
                  className="w-28"
                  disabled={busy !== null}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
                <p className="max-w-xs text-[11px] leading-relaxed text-muted">{field.hint}</p>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void saveConfig()}
              loading={busy === "config"}
            >
              <Save aria-hidden="true" />
              Save settings
            </Button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <Alert tone="success" className="mt-3" title="Saved">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mt-3" title="That change was not saved">
          {error}
        </Alert>
      ) : null}

      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {state.updatedAt
          ? `Last configuration change: ${state.updatedAt}`
          : "Using the built-in defaults — this rule has not been reconfigured."}
      </p>
    </li>
  );
}