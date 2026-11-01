"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api/client";

/**
 * Runs an evaluation and refreshes the page.
 *
 * The success message reports exactly what the server returned — how many
 * reminders were opened and resolved — so the button never implies work that did
 * not happen.
 */
export function AutomationRunButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);

    const response = await apiPost<{
      run: { alertsOpened: number; alertsResolved: number; rulesEvaluated: number };
      skippedRules: string[];
    }>("/api/automation/run");

    setBusy(false);

    if (!response.ok) {
      setError(response.error.message);
      return;
    }

    const { run, skippedRules } = response.data;
    setResult(
      `Evaluated ${run.rulesEvaluated} rule${run.rulesEvaluated === 1 ? "" : "s"}: ` +
        `${run.alertsOpened} reminder${run.alertsOpened === 1 ? "" : "s"} open, ` +
        `${run.alertsResolved} resolved.` +
        (skippedRules.length > 0 ? ` Skipped (disabled): ${skippedRules.join(", ")}.` : ""),
    );
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={() => void run()} loading={busy}>
        <Send aria-hidden="true" />
        Run evaluation
      </Button>
      {result ? (
        <Alert tone="success" title="Evaluation complete">
          {result}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" title="The evaluation did not run">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}