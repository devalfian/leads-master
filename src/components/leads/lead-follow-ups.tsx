"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiDelete, apiPost } from "@/lib/api/client";
import { submitWrite } from "@/lib/offline/client";
import { followUpState } from "@/components/leads/lead-badges";
import { FOLLOW_UP_TYPES, FOLLOW_UP_TYPE_LABELS, type FollowUp } from "@/lib/leads/types";

export function LeadFollowUps({
  leadId,
  followUps,
  doNotContact,
}: {
  leadId: string;
  followUps: FollowUp[];
  doNotContact: boolean;
}) {
  const router = useRouter();
  const [dueAt, setDueAt] = useState("");
  const [type, setType] = useState("call_back");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUp | null>(null);

  async function add() {
    if (!dueAt) {
      setError("Choose a due date for the follow-up.");
      return;
    }
    setBusy("add");
    setError(null);
    const result = await apiPost(`/api/leads/${leadId}/follow-ups`, { dueAt, type, notes });
    setBusy(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDueAt("");
    setNotes("");
    router.refresh();
  }

  async function setStatus(id: string, status: "scheduled" | "completed" | "cancelled") {
    setBusy(id);
    setError(null);
    setNotice(null);
    const outcome = await submitWrite({
      method: "PATCH",
      url: `/api/follow-ups/${id}`,
      body: { status },
      label: `Follow-up ${status}`,
    });
    setBusy(null);

    if (outcome.status === "queued") {
      // The list keeps showing the old state until the change reaches the server.
      setNotice("Follow-up update saved on this device. It will sync when you are back online.");
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }
    router.refresh();
  }

  async function remove(followUp: FollowUp): Promise<string | null> {
    const result = await apiDelete(`/api/follow-ups/${followUp.id}`);
    if (!result.ok) return result.error.message;
    router.refresh();
    return null;
  }

  const ordered = [
    ...followUps.filter((followUp) => followUp.status === "scheduled"),
    ...followUps.filter((followUp) => followUp.status !== "scheduled"),
  ];

  return (
    <section className="rounded-card border border-border-subtle bg-surface p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <CalendarPlus className="size-4 text-accent-soft" aria-hidden="true" />
        Follow-ups
      </h2>

      {doNotContact ? (
        <p className="mt-2 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          This lead asked not to be contacted. Clear the do-not-contact flag in Edit lead before
          scheduling anything.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-[140px_150px_minmax(0,1fr)_auto]">
          <div className="space-y-1">
            <Label htmlFor="follow-due" className="text-[11px]">
              Due date
            </Label>
            <Input
              id="follow-due"
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="follow-type" className="text-[11px]">
              Type
            </Label>
            <Select id="follow-type" value={type} onChange={(event) => setType(event.target.value)}>
              {FOLLOW_UP_TYPES.map((entry) => (
                <option key={entry} value={entry}>
                  {FOLLOW_UP_TYPE_LABELS[entry]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="follow-notes" className="text-[11px]">
              Note
            </Label>
            <Input
              id="follow-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={add} loading={busy === "add"}>
              Schedule
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <Alert tone="danger" className="mt-3" title="That did not save">
          {error}
        </Alert>
      ) : null}

      {notice ? (
        <Alert tone="info" className="mt-3" title="Saved on this device">
          {notice}
        </Alert>
      ) : null}

      {followUps.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-muted">
          No follow-ups are scheduled. You can schedule one here or while logging a call.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border-subtle">{ordered.map((followUp) => {
            const state = followUpState(followUp.dueAt);
            const tone =
              followUp.status === "completed"
                ? "success"
                : followUp.status === "cancelled"
                  ? "neutral"
                  : state === "overdue"
                    ? "danger"
                    : state === "today"
                      ? "warning"
                      : "info";
            const label =
              followUp.status === "completed"
                ? "Completed"
                : followUp.status === "cancelled"
                  ? "Cancelled"
                  : state === "overdue"
                    ? "Overdue"
                    : state === "today"
                      ? "Due today"
                      : "Scheduled";

            return (
              <li key={followUp.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] text-foreground">
                    <span>{FOLLOW_UP_TYPE_LABELS[followUp.type]}</span>
                    <Badge tone={tone}>{label}</Badge>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    Due {followUp.dueAt.slice(0, 10)}
                    {followUp.notes ? ` · ${followUp.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {followUp.status === "scheduled" ? (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        loading={busy === followUp.id}
                        onClick={() => setStatus(followUp.id, "completed")}
                      >
                        <Check aria-hidden="true" />
                        Complete
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Cancel follow-up"
                        onClick={() => setStatus(followUp.id, "cancelled")}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busy === followUp.id}
                      onClick={() => setStatus(followUp.id, "scheduled")}
                    >
                      <RotateCcw aria-hidden="true" />
                      Reopen
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete follow-up"
                    onClick={() => setDeleteTarget(followUp)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}</ul>
      )}

      {deleteTarget ? (
        <ConfirmDialog
          open
          onOpenChange={(next) => {
            if (!next) setDeleteTarget(null);
          }}
          title="Delete this follow-up?"
          description={`${FOLLOW_UP_TYPE_LABELS[deleteTarget.type]} · due ${deleteTarget.dueAt.slice(0, 10)}`}
          consequence="The reminder is removed. Calls already logged stay in Call History."
          confirmLabel="Delete follow-up"
          onConfirm={() => remove(deleteTarget)}
        />
      ) : null}
    </section>
  );
}