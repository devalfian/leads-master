"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label, FieldHint } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { apiPost } from "@/lib/api/client";
import type { CallSessionDetail } from "@/lib/callbooks/types";

/**
 * Starts a real call session. The prospect name is optional free text — there is
 * no CRM module in this workspace, so nothing is invented about the prospect.
 */
export function StartCallDialog({
  callbookId,
  callbookTitle,
  publishedVersion,
  contextSessionId = null,
  leadId = null,
  open,
  onOpenChange,
}: {
  callbookId: string;
  callbookTitle: string;
  publishedVersion: number;
  /** Optional Session Planner session whose snapshot supplies the call's pricing context. */
  contextSessionId?: string | null;
  /** Optional lead the call belongs to; its business name is snapshotted. */
  leadId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [prospectName, setProspectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function startCall() {
    setStarting(true);
    setError(null);
    const result = await apiPost<{ session: CallSessionDetail }>(
      `/api/callbooks/${callbookId}/sessions`,
      { prospectName: prospectName.trim() || null, leadId },
    );
    if (!result.ok) {
      setError(result.error.message);
      setStarting(false);
      return;
    }
    const target = `/calls/${result.data.session.id}`;
    router.push(
      contextSessionId ? `${target}?context=${encodeURIComponent(contextSessionId)}` : target,
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!starting) {
          if (!next) setError(null);
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start a call</DialogTitle>
          <DialogDescription>
            {callbookTitle} · published version {publishedVersion}. The call follows this published
            version, even if you edit the Callbook later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {leadId ? (
            <p className="rounded-[10px] border border-info/30 bg-info/10 px-3 py-2 text-[11.5px] leading-relaxed text-info">
              This call is linked to a saved lead. The business name is stored with the call and it
              appears on the lead&apos;s activity.
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="prospect-name">Prospect or business name (optional)</Label>
            <Input
              id="prospect-name"
              value={prospectName}
              onChange={(event) => setProspectName(event.target.value)}
              placeholder="e.g. Harbour Plumbing"
              maxLength={200}
              autoComplete="off"
            />
            <FieldHint>Used to label this call in Call History. You can leave it empty.</FieldHint>
          </div>

          {error ? <Alert tone="danger" title="The call could not be started">{error}</Alert> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={starting}>
            Cancel
          </Button>
          <Button onClick={startCall} loading={starting}>
            <Phone aria-hidden="true" />
            Start call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}