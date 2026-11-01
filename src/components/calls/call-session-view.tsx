"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronLeft,
  ClipboardCopy,
  Flag,
  MessageSquarePlus,
  NotebookPen,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { UnexpectedResponsePanel } from "./unexpected-response-panel";
import { QuickNotesPanel } from "./quick-notes-panel";
import { CallContextPanel } from "./call-context-panel";
import { applyOptimisticAdvance, applyOptimisticBack } from "@/lib/callbooks/optimistic";
import { submitWrite } from "@/lib/offline/client";
import { findSnapshotNode, isTerminalNode, sortedNodeBranches } from "@/lib/callbooks/session";
import { getOutcome } from "@/lib/callbooks/outcomes";
import { CALL_STEP_TYPE_LABELS } from "@/lib/callbooks/types";
import type { CallBranch, CallNode, CallSessionDetail } from "@/lib/callbooks/types";
import type { CallbookPricingContext } from "@/lib/callbooks/pricing-context-types";
import { cn } from "@/lib/utils";

export function CallSessionView({
  initialSession,
  pricingContext,
}: {
  initialSession: CallSessionDetail;
  /** Read-only pricing references for this call, resolved on the server. */
  pricingContext: CallbookPricingContext | null;
}) {
  const [session, setSession] = useState<CallSessionDetail>(initialSession);
  const [busyBranchId, setBusyBranchId] = useState<string | null>(null);
  const [goingBack, setGoingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState<"none" | "unexpected" | "notes">("none");

  const currentNode = findSnapshotNode(session.snapshot, session.currentNodeId);
  const terminal = isTerminalNode(currentNode);
  const outcome = getOutcome(currentNode?.outcomeKey ?? null);
  const branches = useMemo(
    () => (currentNode ? sortedNodeBranches(currentNode) : []),
    [currentNode],
  );

  async function advance(branchId: string) {
    setBusyBranchId(branchId);
    setError(null);
    const outcome = await submitWrite<{ session: CallSessionDetail }>({
      method: "POST",
      url: `/api/sessions/${session.id}/advance`,
      body: { branchId },
      label: `Call step · ${session.prospectName ?? session.callbookTitle}`,
    });
    setBusyBranchId(null);

    if (outcome.status === "queued") {
      // No connection: move the view locally and let the queue replay the step.
      const optimistic = applyOptimisticAdvance(session, branchId);
      if (!optimistic) {
        setError("This step cannot be followed without a connection.");
        return;
      }
      setSession(optimistic);
      setStatusNote("Saved on this device. It will sync when you are back online.");
      setCopied(false);
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }
    setSession(outcome.result.data.session);
    setStatusNote("Progress saved.");
    setCopied(false);
  }

  async function goBack() {
    setGoingBack(true);
    setError(null);
    const outcome = await submitWrite<{ session: CallSessionDetail }>({
      method: "POST",
      url: `/api/sessions/${session.id}/back`,
      label: `Step back · ${session.prospectName ?? session.callbookTitle}`,
    });
    setGoingBack(false);

    if (outcome.status === "queued") {
      const optimistic = applyOptimisticBack(session);
      if (!optimistic) {
        setError("You are at the first step.");
        return;
      }
      setSession(optimistic);
      setStatusNote("Saved on this device. It will sync when you are back online.");
      setCopied(false);
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }
    setSession(outcome.result.data.session);
    setStatusNote("Returned to the previous step.");
    setCopied(false);
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(currentNode?.script ?? "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Your browser blocked clipboard access. Select the text to copy it manually.");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted">
              {session.callbookTitle} · published v{session.publishedVersion}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold text-foreground">
                {session.prospectName ?? "Live call"}
              </h1>
              <Badge tone="info">Step {session.path.length}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPanel(panel === "notes" ? "none" : "notes")}
            >
              <NotebookPen aria-hidden="true" />
              Note
            </Button>
            <Button asChild variant="danger" size="sm">
              <Link href={`/calls/${session.id}/summary`}>
                <PhoneOff aria-hidden="true" />
                End call
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-4 px-4 py-5">
        {error ? (
          <Alert tone="danger" title="That did not save">
            {error}
          </Alert>
        ) : null}
        {statusNote && !error ? (
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <Check className="size-3 text-success" aria-hidden="true" />
            {statusNote}
          </p>
        ) : null}

        {panel === "notes" ? (
          <QuickNotesPanel
            session={session}
            onSession={setSession}
            onClose={() => setPanel("none")}
          />
        ) : null}

        {pricingContext ? <CallContextPanel context={pricingContext} /> : null}

        {!currentNode ? (
          <Alert tone="danger" title="This call is missing its current step">
            The published conversation could not be resolved. End the call and record the result, or
            start a new call from the Callbook.
          </Alert>
        ) : (
          <CallCurrentStep
            session={session}
            currentNode={currentNode}
            terminal={terminal}
            outcomeLabel={outcome ? outcome.label : null}
            branches={branches}
            busyBranchId={busyBranchId}
            copied={copied}
            panel={panel}
            onCopy={() => void copyScript()}
            onAdvance={(branchId) => void advance(branchId)}
            onPanel={setPanel}
            onSession={setSession}
          />
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-border-subtle bg-sidebar/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-3">
          <Button
            variant="secondary"
            onClick={() => void goBack()}
            loading={goingBack}
            disabled={session.path.length <= 1 || busyBranchId !== null}
            title={session.path.length <= 1 ? "You are at the first step" : "Back one step"}
          >
            <ChevronLeft aria-hidden="true" />
            Back
          </Button>
          <Button variant="ghost" onClick={() => setPanel(panel === "notes" ? "none" : "notes")}>
            <NotebookPen aria-hidden="true" />
            Add note
          </Button>
          <Button
            variant="ghost"
            onClick={() => setPanel(panel === "unexpected" ? "none" : "unexpected")}
            disabled={terminal}
          >
            <MessageSquarePlus aria-hidden="true" />
            Unexpected
          </Button>
          <Button asChild variant="danger" className="ml-auto">
            <Link href={`/calls/${session.id}/summary`}>
              <PhoneOff aria-hidden="true" />
              End call
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

function CallCurrentStep({
  session,
  currentNode,
  terminal,
  outcomeLabel,
  branches,
  busyBranchId,
  copied,
  panel,
  onCopy,
  onAdvance,
  onPanel,
  onSession,
}: {
  session: CallSessionDetail;
  currentNode: CallNode;
  terminal: boolean;
  outcomeLabel: string | null;
  branches: CallBranch[];
  busyBranchId: string | null;
  copied: boolean;
  panel: "none" | "unexpected" | "notes";
  onCopy: () => void;
  onAdvance: (branchId: string) => void;
  onPanel: (panel: "none" | "unexpected" | "notes") => void;
  onSession: (session: CallSessionDetail) => void;
}) {
  return (
    <>
      <section className="rounded-card border border-border-subtle bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-5 py-3">
          <div className="flex items-center gap-2">
            <Badge tone={terminal ? "success" : "accent"}>
              {terminal ? "Outcome" : "Message"}
            </Badge>
            {currentNode.stepType ? (
              <Badge tone="neutral">{CALL_STEP_TYPE_LABELS[currentNode.stepType]}</Badge>
            ) : null}
            <h2 className="text-[14px] font-semibold text-foreground">
              {currentNode.title.trim() || "Untitled step"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onCopy}>
            {copied ? <Check aria-hidden="true" /> : <ClipboardCopy aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="px-5 py-6">
          {currentNode.purpose ? (
            <p className="mb-3 rounded-[10px] border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] leading-relaxed text-accent-soft">
              <span className="font-semibold uppercase tracking-wider">Purpose: </span>
              {currentNode.purpose}
            </p>
          ) : null}

          <p className="whitespace-pre-wrap text-[19px] leading-relaxed text-foreground">
            {currentNode.script.trim() || "No script written for this step."}
          </p>

          {currentNode.talkingPoints.length > 0 ? (
            <ul className="mt-3 space-y-1 rounded-[10px] border border-border-subtle bg-background/60 p-3">
              {currentNode.talkingPoints.map((point) => (
                <li key={point} className="text-[12.5px] leading-relaxed text-secondary">
                  • {point}
                </li>
              ))}
            </ul>
          ) : null}

          {currentNode.internalNote ? (
            <div className="mt-4 rounded-[10px] border border-border-subtle bg-background/60 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Delivery tip
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                {currentNode.internalNote}
              </p>
            </div>
          ) : null}
        </div>

        {terminal ? (
          <div className="space-y-3 border-t border-border-subtle px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <Flag className="size-4 text-success" aria-hidden="true" />
              <span className="text-[13px] font-medium text-foreground">End of this path</span>
              {outcomeLabel ? <Badge tone="success">{outcomeLabel}</Badge> : null}
            </div>
            <p className="text-[12px] leading-relaxed text-secondary">
              Finish the call and record what actually happened. The outcome is pre-selected from
              this step, and you can change it.
            </p>
            <Button asChild size="lg">
              <Link href={`/calls/${session.id}/summary`}>
                <PhoneOff aria-hidden="true" />
                Finish call &amp; record result
              </Link>
            </Button>
          </div>
        ) : null}
      </section>

      {!terminal ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              What did the prospect say?
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPanel(panel === "unexpected" ? "none" : "unexpected")}
            >
              <MessageSquarePlus aria-hidden="true" />
              Other / unexpected
            </Button>
          </div>

          {branches.length === 0 ? (
            <Alert tone="warning" title="No responses on this step">
              This step has no prepared responses. Use “Other / unexpected” to record what they said.
            </Alert>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            {branches.map((branch) => {
              const target = findSnapshotNode(session.snapshot, branch.nextNodeId);
              const example = branch.examplePhrases.find((phrase) => phrase.trim().length > 0);
              return (
                <button
                  key={branch.id}
                  type="button"
                  disabled={!target || busyBranchId !== null}
                  onClick={() => onAdvance(branch.id)}
                  aria-busy={busyBranchId === branch.id || undefined}
                  className={cn(
                    "rounded-[12px] border px-4 py-3 text-left transition-colors duration-150",
                    target
                      ? "border-border-subtle bg-surface hover:border-accent-soft/70 hover:bg-accent/10 focus-visible:border-accent-soft"
                      : "cursor-not-allowed border-warning/30 bg-warning/5",
                    busyBranchId === branch.id && "border-accent bg-accent/15",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-medium text-foreground">
                      {branch.label.trim() || "Untitled response"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {target ? `→ ${target.title.trim() || "Untitled step"}` : "Not connected"}
                    </span>
                  </span>
                  {example ? (
                    <span className="mt-1 block truncate text-[11px] italic text-muted">
                      “{example}”
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {panel === "unexpected" && !terminal ? (
        <UnexpectedResponsePanel
          session={session}
          currentNode={currentNode}
          onSession={onSession}
          onClose={() => onPanel("none")}
        />
      ) : null}
    </>
  );
}