"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PrintButton } from "@/components/shared/print-button";
import { apiDelete, apiPost } from "@/lib/api/client";

/** Session header actions: print, edit, duplicate and a confirmed delete. */
export function SessionActions({
  sessionId,
  sessionTitle,
}: {
  sessionId: string;
  sessionTitle: string;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function duplicate() {
    setBusy(true);
    setError(null);
    const result = await apiPost<{ session: { id: string } }>(`/api/sessions/${sessionId}/duplicate`);
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push(`/dashboard/sessions/${result.data.session.id}`);
    router.refresh();
  }

  async function remove(): Promise<string | null> {
    const result = await apiDelete(`/api/sessions/${sessionId}`);
    if (!result.ok) return result.error.message;
    router.push("/dashboard/sessions");
    router.refresh();
    return null;
  }

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <PrintButton />
        <Button asChild variant="secondary">
          <Link href={`/dashboard/sessions/${sessionId}/edit`}>
            <Pencil aria-hidden="true" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" onClick={duplicate} loading={busy}>
          <Copy aria-hidden="true" />
          Duplicate
        </Button>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </div>

      {error ? <Alert tone="danger" title="That action did not complete">{error}</Alert> : null}

      {deleteOpen ? (
        <ConfirmDialog
          open
          onOpenChange={setDeleteOpen}
          title="Delete this session?"
          description={`“${sessionTitle}” will be removed from Session Planner.`}
          consequence="The saved snapshot is deleted with it. Guide data and pricing are not affected."
          confirmLabel="Delete session"
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}