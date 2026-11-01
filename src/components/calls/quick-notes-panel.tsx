"use client";

import { useState } from "react";
import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint, Label, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { applyOptimisticNote } from "@/lib/callbooks/optimistic";
import { submitWrite } from "@/lib/offline/client";
import type { CallSessionDetail } from "@/lib/callbooks/types";
import { formatDateTime } from "@/lib/utils";

export function QuickNotesPanel({
  session,
  onSession,
  onClose,
}: {
  session: CallSessionDetail;
  onSession: (session: CallSessionDetail) => void;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveNote() {
    if (!body.trim()) {
      setError("Write something before saving the note.");
      return;
    }
    setSaving(true);
    setError(null);

    const trimmed = body.trim();
    const outcome = await submitWrite<{ session: CallSessionDetail }>({
      method: "POST",
      url: `/api/sessions/${session.id}/notes`,
      body: { body: trimmed },
      label: `Quick note · ${session.prospectName ?? session.callbookTitle}`,
    });
    setSaving(false);

    if (outcome.status === "queued") {
      // Show the note immediately; the server assigns the real id when it syncs.
      const optimistic = applyOptimisticNote(session, trimmed);
      if (optimistic) onSession(optimistic);
      setBody("");
      return;
    }

    if (!outcome.result.ok) {
      setError(outcome.result.error.message);
      return;
    }

    onSession(outcome.result.data.session);
    setBody("");
  }

  return (
    <div className="rounded-card border border-border-subtle bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <NotebookPen className="size-4 text-accent-soft" aria-hidden="true" />
          Quick notes
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        <Label htmlFor="quick-note">Add a note without leaving the call</Label>
        <Textarea
          id="quick-note"
          value={body}
          rows={2}
          maxLength={2000}
          placeholder="e.g. Wants a cheaper package. Follow up Tuesday."
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => void saveNote()} loading={saving}>
            <Plus aria-hidden="true" />
            Save note
          </Button>
          <FieldHint>Saved against this call session.</FieldHint>
        </div>

        {error ? <Alert tone="danger" title="Note not saved">{error}</Alert> : null}

        {session.quickNotes.length > 0 ? (
          <ul className="mt-2 space-y-1.5 border-t border-border-subtle pt-2">
            {session.quickNotes.map((note) => (
              <li key={note.id} className="rounded-[8px] bg-background/60 px-2.5 py-2">
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-secondary">
                  {note.body}
                </p>
                <p className="mt-1 text-[10px] text-muted">{formatDateTime(note.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-muted">No notes on this call yet.</p>
        )}
      </div>
    </div>
  );
}