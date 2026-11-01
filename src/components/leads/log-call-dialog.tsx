"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FieldHint, Input, Label, Select, Textarea } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitWrite } from "@/lib/offline/client";
import { OUTCOMES } from "@/lib/callbooks/outcomes";
import {
  FOLLOW_UP_TYPES,
  FOLLOW_UP_TYPE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from "@/lib/leads/types";
import type { LeadStatus } from "@/lib/leads/types";

/**
 * Logs a call for one lead.
 *
 * Outcome and lead status are separate fields: the outcome describes this call,
 * the status only changes when the user picks one explicitly.
 */
export function LogCallDialog({
  leadId,
  businessName,
  doNotContact,
  packages = [],
  callbooks = [],
  open,
  onOpenChange,
}: {
  leadId: string;
  businessName: string;
  doNotContact: boolean;
  packages?: Array<{ id: string; label: string }>;
  callbooks?: Array<{ id: string; title: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [outcomeKey, setOutcomeKey] = useState("no_answer");
  const [calledAt, setCalledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [packageId, setPackageId] = useState("");
  const [callbookId, setCallbookId] = useState("");
  const [status, setStatus] = useState<"" | LeadStatus>("");
  const [markDoNotContact, setMarkDoNotContact] = useState(false);
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpType, setFollowUpType] = useState("call_back");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);

    const body = {
      outcomeKey,
      calledAt: calledAt ? new Date(calledAt).toISOString() : null,
      notes,
      nextAction: nextAction.trim() || null,
      packageId: packageId || null,
      callbookId: callbookId || null,
      status: status || null,
      markDoNotContact,
      followUp: followUpAt ? { dueAt: followUpAt, type: followUpType, notes: followUpNotes } : null,
    };

    const outcome = await submitWrite({
      method: "POST",
      url: `/api/leads/${leadId}/calls`,
      body,
      label: `Log a call · ${businessName}`,
    });

    setBusy(false);
    if (outcome.status === "queued") {
      // Stored on this device; the sync panel reports when it reaches the server.
      onOpenChange(false);
      return;
    }
    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Log a call</DialogTitle>
          <DialogDescription>{businessName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="log-outcome">What happened?</Label>
              <Select
                id="log-outcome"
                value={outcomeKey}
                onChange={(event) => setOutcomeKey(event.target.value)}
              >
                {OUTCOMES.map((outcome) => (
                  <option key={outcome.key} value={outcome.key}>
                    {outcome.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="log-called-at">Call date and time</Label>
              <Input
                id="log-called-at"
                type="datetime-local"
                value={calledAt}
                onChange={(event) => setCalledAt(event.target.value)}
              />
              <FieldHint>Leave empty to use the current time.</FieldHint>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-notes">Notes</Label>
            <Textarea
              id="log-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="What did they say? Anything useful for the next call."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="log-next">Next action</Label>
            <Input
              id="log-next"
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              maxLength={240}
              placeholder="Optional"
            />
          </div>

          {packages.length > 0 || callbooks.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.length > 0 ? (
                <div className="space-y-1.5">
                  <Label htmlFor="log-package">Package discussed</Label>
                  <Select
                    id="log-package"
                    value={packageId}
                    onChange={(event) => setPackageId(event.target.value)}
                  >
                    <option value="">None recorded</option>
                    {packages.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
              {callbooks.length > 0 ? (
                <div className="space-y-1.5">
                  <Label htmlFor="log-callbook">Callbook used</Label>
                  <Select
                    id="log-callbook"
                    value={callbookId}
                    onChange={(event) => setCallbookId(event.target.value)}
                  >
                    <option value="">None recorded</option>
                    {callbooks.map((callbook) => (
                      <option key={callbook.id} value={callbook.id}>
                        {callbook.title}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}

          <fieldset className="space-y-2 rounded-[10px] border border-border-subtle bg-background/40 p-3">
            <legend className="px-1 text-[12px] font-medium text-secondary">Follow-up</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="log-follow-date">Due date</Label>
                <Input
                  id="log-follow-date"
                  type="date"
                  value={followUpAt}
                  onChange={(event) => setFollowUpAt(event.target.value)}
                  disabled={doNotContact}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="log-follow-type">Type</Label>
                <Select
                  id="log-follow-type"
                  value={followUpType}
                  onChange={(event) => setFollowUpType(event.target.value)}
                  disabled={!followUpAt || doNotContact}
                >
                  {FOLLOW_UP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {FOLLOW_UP_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Input
              value={followUpNotes}
              onChange={(event) => setFollowUpNotes(event.target.value)}
              maxLength={2000}
              placeholder="Follow-up note (optional)"
              aria-label="Follow-up note"
              disabled={!followUpAt}
            />
            {doNotContact ? (
              <FieldHint>
                This lead asked not to be contacted, so a follow-up date cannot be scheduled yet.
              </FieldHint>
            ) : null}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="log-status">Update lead status</Label>
              <Select
                id="log-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as "" | LeadStatus)}
              >
                <option value="">Leave unchanged</option>
                {LEAD_STATUSES.map((entry) => (
                  <option key={entry} value={entry}>
                    {LEAD_STATUS_LABELS[entry]}
                  </option>
                ))}
              </Select>
            </div>
            <label className="flex items-end gap-2 pb-2 text-[12px] text-secondary">
              <input
                type="checkbox"
                checked={markDoNotContact}
                onChange={(event) => setMarkDoNotContact(event.target.checked)}
              />
              Prospect asked not to be contacted again
            </label>
          </div>

          {error ? <Alert tone="danger" title="The call was not saved">{error}</Alert> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            <Check aria-hidden="true" />
            Save call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}