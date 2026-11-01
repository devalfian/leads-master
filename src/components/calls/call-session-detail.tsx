import { ArrowRight, CornerDownRight, Flag, RotateCcw, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutcomeBadge } from "@/components/callbooks/status-badges";
import { findSnapshotNode } from "@/lib/callbooks/session";
import type { CallSessionDetail, CallSessionStep } from "@/lib/callbooks/types";
import { formatDateTime } from "@/lib/utils";

function stepTitle(session: CallSessionDetail, nodeId: string | null): string {
  const node = findSnapshotNode(session.snapshot, nodeId);
  return node?.title.trim() || "Untitled step";
}

function describeStep(
  step: CallSessionStep,
  session: CallSessionDetail,
): { icon: React.ReactNode; text: string; extra?: string } {
  if (step.kind === "start") {
    return {
      icon: <Flag className="size-3.5 text-accent-soft" aria-hidden="true" />,
      text: `Call started at “${stepTitle(session, step.toNodeId)}”`,
    };
  }
  if (step.kind === "back") {
    return {
      icon: <Undo2 className="size-3.5 text-info" aria-hidden="true" />,
      text: `Went back to “${stepTitle(session, step.toNodeId)}”`,
    };
  }
  if (step.kind === "restart") {
    return {
      icon: <RotateCcw className="size-3.5 text-info" aria-hidden="true" />,
      text: `Restarted at “${stepTitle(session, step.toNodeId)}”`,
    };
  }
  if (step.kind === "unexpected") {
    return {
      icon: <CornerDownRight className="size-3.5 text-warning" aria-hidden="true" />,
      text: `Unexpected answer: “${step.responseText ?? ""}”`,
      extra: step.toNodeId ? stepTitle(session, step.toNodeId) : undefined,
    };
  }
  return {
    icon: <ArrowRight className="size-3.5 text-secondary" aria-hidden="true" />,
    text: `Prospect said: “${step.label ?? "Untitled response"}”`,
    extra: stepTitle(session, step.toNodeId),
  };
}

export function CallSessionDetailView({ session }: { session: CallSessionDetail }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>Call summary</span>
            <OutcomeBadge outcomeKey={session.outcomeKey} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Callbook">
              {session.callbookTitle} <span className="text-muted">· v{session.publishedVersion}</span>
            </Field>
            <Field label="Prospect">{session.prospectName ?? "Not recorded"}</Field>
            <Field label="Started">{formatDateTime(session.startedAt)}</Field>
            <Field label="Ended">{session.endedAt ? formatDateTime(session.endedAt) : "—"}</Field>
            <Field label="Steps followed">{session.path.length}</Field>
            <Field label="Follow-up">
              {session.followUpAt ? formatDateTime(session.followUpAt) : "None recorded"}
            </Field>
            {session.nextAction ? (
              <div className="sm:col-span-2">
                <Field label="Next action">{session.nextAction}</Field>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation path</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {session.steps.map((step) => {
              const described = describeStep(step, session);
              return (
                <li key={step.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5">{described.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] leading-relaxed text-secondary">{described.text}</p>
                    {described.extra ? (
                      <p className="text-[11px] text-muted">→ {described.extra}</p>
                    ) : null}
                    <p className="text-[10px] text-muted">{formatDateTime(step.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      {session.quickNotes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes captured during the call</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {session.quickNotes.map((note) => (
                <li key={note.id} className="rounded-[8px] bg-background/60 px-3 py-2">
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                    {note.body}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">{formatDateTime(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Call notes</CardTitle>
        </CardHeader>
        <CardContent>
          {session.notes.trim() ? (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-secondary">
              {session.notes}
            </p>
          ) : (
            <p className="text-[12px] text-muted">No notes were saved for this call.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-foreground">{children}</dd>
    </div>
  );
}