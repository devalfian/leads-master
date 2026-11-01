"use client";

import { useState } from "react";
import { CornerDownRight, MessageSquarePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint, Label, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { applyOptimisticAdvance } from "@/lib/callbooks/optimistic";
import { submitWrite } from "@/lib/offline/client";
import { sortedNodeBranches } from "@/lib/callbooks/session";
import type { CallNode, CallSessionDetail } from "@/lib/callbooks/types";
import { findNode } from "@/lib/callbooks/graph";
import { truncate } from "@/lib/utils";

/**
 * Handles answers that do not match any prepared response. There is no speech
 * recognition or AI here: the user records what was said and decides what to do.
 */
export function UnexpectedResponsePanel({
  session,
  currentNode,
  onSession,
  onClose,
}: {
  session: CallSessionDetail;
  currentNode: CallNode;
  onSession: (session: CallSessionDetail) => void;
  onClose: () => void;
}) {
  const [responseText, setResponseText] = useState("");
  const [note, setNote] = useState("");
  const [branchId, setBranchId] = useState("");
  const [busy, setBusy] = useState<"continue" | "stay" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const branches = sortedNodeBranches(currentNode).filter(
    (branch) => branch.nextNodeId !== null && findNode(session.snapshot, branch.nextNodeId) !== null,
  );

  async function submit(mode: "continue" | "stay") {
    if (!responseText.trim()) {
      setError("Record what the prospect said first.");
      return;
    }
    setBusy(mode);
    setError(null);

    const outcome = await submitWrite<{ session: CallSessionDetail }>({
      method: "POST",
      url: `/api/sessions/${session.id}/unexpected`,
      body: {
        responseText: responseText.trim(),
        note: note.trim() || null,
        branchId: mode === "continue" && branchId ? branchId : null,
      },
      label: `Unexpected response · ${session.prospectName ?? session.callbookTitle}`,
    });

    setBusy(null);

    if (outcome.status === "queued") {
      // The server owns the step log; locally we can only show the branch the
      // user picked. Staying on the step leaves the view unchanged.
      if (mode === "continue" && branchId) {
        const optimistic = applyOptimisticAdvance(session, branchId);
        if (optimistic) onSession(optimistic);
      }
      setResponseText("");
      setNote("");
      setBranchId("");
      onClose();
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }

    onSession(outcome.result.data.session);
    setResponseText("");
    setNote("");
    setBranchId("");
    onClose();
  }

  return (
    <div className="rounded-card border border-warning/30 bg-warning/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <MessageSquarePlus className="size-4 text-warning" aria-hidden="true" />
            Unexpected response
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-secondary">
            Nothing is routed automatically. Record what they said, then choose whether to continue
            on a branch or stay on this step.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="unexpected-text">What did they say?</Label>
          <Textarea
            id="unexpected-text"
            value={responseText}
            rows={2}
            maxLength={500}
            placeholder="Type their answer as close to their words as you can."
            onChange={(event) => setResponseText(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unexpected-branch">Closest prepared response (optional)</Label>
          <Select
            id="unexpected-branch"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">Stay on this step</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.label.trim() || "Untitled response"}
              </option>
            ))}
          </Select>
          <FieldHint>
            Only the responses you prepared for this step are listed. Nothing is added to the
            Callbook during a call.
          </FieldHint>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="unexpected-note">Quick note (optional)</Label>
          <Textarea
            id="unexpected-note"
            value={note}
            rows={2}
            maxLength={2000}
            placeholder="e.g. Asked for an email with pricing."
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        {error ? <Alert tone="danger" title="Not saved">{error}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void submit("continue")}
            loading={busy === "continue"}
            disabled={!branchId || busy !== null}
            title={branchId ? undefined : "Choose a branch to continue on"}
          >
            <CornerDownRight aria-hidden="true" />
            Save &amp; continue
          </Button>
          <Button variant="secondary" onClick={() => void submit("stay")} loading={busy === "stay"} disabled={busy !== null}>
            <Save aria-hidden="true" />
            Save &amp; stay here
          </Button>
          <Button asChild variant="ghost">
            <a href={`/calls/${session.id}/summary`}>End the call</a>
          </Button>
        </div>

        <p className="text-[11px] text-muted">
          Current step: {truncate(currentNode.title || "Untitled step", 60)}
        </p>
      </div>
    </div>
  );
}