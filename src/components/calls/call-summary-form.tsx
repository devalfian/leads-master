"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import { submitWrite } from "@/lib/offline/client";
import { OUTCOMES, getOutcome } from "@/lib/callbooks/outcomes";
import { findSnapshotNode } from "@/lib/callbooks/session";
import type { CallSessionDetail } from "@/lib/callbooks/types";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/utils";

export function CallSummaryForm({ session }: { session: CallSessionDetail }) {
  const router = useRouter();

  const suggested = useMemo(() => {
    const node = findSnapshotNode(session.snapshot, session.currentNodeId);
    return node?.type === "outcome" ? node.outcomeKey : null;
  }, [session.currentNodeId, session.snapshot]);

  const [outcomeKey, setOutcomeKey] = useState<string>(suggested ?? "");
  const [notes, setNotes] = useState(session.notes);
  const [nextAction, setNextAction] = useState(session.nextAction ?? "");
  const [followUpAt, setFollowUpAt] = useState(toDateTimeLocalValue(session.followUpAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [queued, setQueued] = useState(false);

  const outcome = getOutcome(outcomeKey);
  const showFollowUp = outcome?.suggestsFollowUp ?? Boolean(followUpAt);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);

    if (!outcomeKey) {
      setFieldErrors(["Choose a result for this call."]);
      return;
    }

    setSaving(true);
    const outcome = await submitWrite<{ session: CallSessionDetail }>({
      method: "POST",
      url: `/api/sessions/${session.id}/finish`,
      body: {
        outcomeKey,
        notes,
        nextAction: nextAction.trim() || null,
        // A follow-up date is only stored when the outcome calls for one.
        followUpAt: showFollowUp && followUpAt ? new Date(followUpAt).toISOString() : null,
      },
      label: `Call result · ${session.prospectName ?? session.callbookTitle}`,
    });
    setSaving(false);

    if (outcome.status === "queued") {
      // The result is on this device. Navigating to the call page would land on
      // a page that may not be cached, so stay here and say what happened.
      setQueued(true);
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      if (outcome.result.error.details) setFieldErrors(outcome.result.error.details);
      return;
    }

    router.push(`/calls/${session.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="rounded-card border border-border-subtle bg-surface p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Callbook</dt>
            <dd className="mt-0.5 text-[13px] text-foreground">{session.callbookTitle}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Prospect</dt>
            <dd className="mt-0.5 text-[13px] text-foreground">
              {session.prospectName ?? "Not recorded"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Started</dt>
            <dd className="mt-0.5 text-[13px] text-secondary">
              {formatDateTime(session.startedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wider text-muted">Steps followed</dt>
            <dd className="mt-0.5 text-[13px] text-secondary">{session.path.length}</dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-border-subtle pt-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Route taken</p>
          <ol className="mt-2 flex flex-wrap items-center gap-1.5">
            {session.path.map((nodeId, index) => {
              const node = findSnapshotNode(session.snapshot, nodeId);
              return (
                <li key={`${nodeId}-${index}`} className="flex items-center gap-1.5">
                  <Badge tone={index === session.path.length - 1 ? "accent" : "neutral"}>
                    {node?.title.trim() || "Untitled step"}
                  </Badge>
                  {index < session.path.length - 1 ? (
                    <span className="text-[10px] text-muted">→</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        {session.quickNotes.length > 0 ? (
          <div className="mt-4 border-t border-border-subtle pt-3">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              Notes captured during the call
            </p>
            <ul className="mt-2 space-y-1.5">
              {session.quickNotes.map((note) => (
                <li key={note.id} className="rounded-[8px] bg-background/60 px-2.5 py-2">
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                    {note.body}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">{formatDateTime(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="space-y-4 rounded-card border border-border-subtle bg-surface p-5">
        <div className="space-y-1.5">
          <Label htmlFor="call-outcome">
            Result <span className="text-danger">*</span>
          </Label>
          <Select
            id="call-outcome"
            value={outcomeKey}
            onChange={(event) => setOutcomeKey(event.target.value)}
            aria-required="true"
          >
            <option value="">Choose the actual result…</option>
            {OUTCOMES.map((definition) => (
              <option key={definition.key} value={definition.key}>
                {definition.label}
              </option>
            ))}
          </Select>
          <FieldHint>
            {suggested && suggested === outcomeKey
              ? "Pre-selected from the outcome step you finished on. Change it if the call went differently."
              : "Record what actually happened, not what the script intended."}
          </FieldHint>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="call-notes">Call notes</Label>
          <Textarea
            id="call-notes"
            value={notes}
            rows={5}
            maxLength={8000}
            placeholder="Summary, what they need, objections, promises made."
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="follow-up-at">Follow-up date and time</Label>
            <Input
              id="follow-up-at"
              type="datetime-local"
              value={followUpAt}
              onChange={(event) => setFollowUpAt(event.target.value)}
              disabled={!showFollowUp}
            />
            <FieldHint>
              {showFollowUp
                ? "Stored with this call so you can find it in Call History."
                : "Relevant for follow-up results. Choose a follow-up outcome to enable it."}
            </FieldHint>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next-action">Next action</Label>
            <Input
              id="next-action"
              value={nextAction}
              maxLength={200}
              placeholder="e.g. Send proposal with two example sites"
              onChange={(event) => setNextAction(event.target.value)}
            />
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted">
          Follow-ups are recorded in this workspace only. No calendar or email integration is
          connected.
        </p>
      </div>

      {error ? <Alert tone="danger" title="The call result was not saved">{error}</Alert> : null}
      {fieldErrors.length > 0 ? (
        <Alert tone="warning" title="Check the form">
          <ul className="list-inside list-disc">
            {fieldErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {queued ? (
        <Alert tone="success" title="Call result saved on this device">
          There is no connection right now, so this result is stored here and sent to the server
          automatically once you are back online. You can close this page.
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="lg" loading={saving} disabled={queued}>
          <Save aria-hidden="true" />
          Save call result
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={`/calls/${session.id}`}>
            <X aria-hidden="true" />
            Back to the call
          </Link>
        </Button>
      </div>
    </form>
  );
}