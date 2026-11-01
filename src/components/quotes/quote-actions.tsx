"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Copy, Pencil, Send, Trash2, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PrintButton } from "@/components/shared/print-button";
import { apiDelete, apiPost } from "@/lib/api/client";
import { canTransitionQuote, type QuoteStatus } from "@/lib/quotes/types";

type PendingAction = {
  status: QuoteStatus;
  title: string;
  description: string;
  consequence: string;
  confirmLabel: string;
};

/**
 * Lifecycle controls. Every status change is an explicit click confirmed by the
 * server — nothing here marks a quotation as sent, accepted or paid by inference
 * from a call, a print or an export.
 */
export function QuoteActions({ quoteId, status }: { quoteId: string; status: QuoteStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function changeStatus(next: QuoteStatus): Promise<string | null> {
    setBusy(next);
    setError(null);
    setNotice(null);
    const result = await apiPost<{ quote: unknown }>(`/api/quotes/${quoteId}/status`, {
      status: next,
    });
    setBusy(null);
    if (!result.ok) return result.error.message;
    setNotice(`This quotation is now recorded as ${next}.`);
    router.refresh();
    return null;
  }

  async function duplicate(): Promise<string | null> {
    setDuplicating(true);
    setError(null);
    const result = await apiPost<{ quote: { id: string } }>(`/api/quotes/${quoteId}/duplicate`);
    setDuplicating(false);
    if (!result.ok) return result.error.message;
    router.push(`/quotes/${result.data.quote.id}`);
    router.refresh();
    return null;
  }

  async function remove(): Promise<string | null> {
    const result = await apiDelete<{ deleted: boolean }>(`/api/quotes/${quoteId}`);
    if (!result.ok) return result.error.message;
    router.push("/quotes");
    router.refresh();
    return null;
  }

  const can = (next: QuoteStatus) => canTransitionQuote(status, next);

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        {status === "draft" ? (
          <Button asChild variant="secondary">
            <Link href={`/quotes/${quoteId}/edit`}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
        ) : null}

        {can("sent") ? (
          <Button onClick={() => void changeStatus("sent")} loading={busy === "sent"}>
            <Send aria-hidden="true" />
            Mark as sent
          </Button>
        ) : null}

        {can("accepted") ? (
          <Button
            variant="success"
            onClick={() => void changeStatus("accepted")}
            loading={busy === "accepted"}
          >
            <CheckCircle2 aria-hidden="true" />
            Record acceptance
          </Button>
        ) : null}

        {can("rejected") ? (
          <Button
            variant="danger"
            onClick={() =>
              setPending({
                status: "rejected",
                title: "Record this quotation as rejected?",
                description:
                  "The quotation stays in your list as a historical record. Rejection is final — duplicate the quotation to try again.",
                consequence: "A rejected quotation cannot be reopened or edited.",
                confirmLabel: "Record rejection",
              })
            }
          >
            <XCircle aria-hidden="true" />
            Record rejection
          </Button>
        ) : null}

        {can("cancelled") ? (
          <Button
            variant="outline"
            onClick={() =>
              setPending({
                status: "cancelled",
                title: "Cancel this quotation?",
                description:
                  "Cancelling keeps the record but ends the lifecycle. Duplicate the quotation if you want to quote the work again.",
                consequence: "A cancelled quotation cannot be reopened.",
                confirmLabel: "Cancel quotation",
              })
            }
          >
            <Ban aria-hidden="true" />
            Cancel quotation
          </Button>
        ) : null}

        <Button variant="secondary" onClick={() => void duplicate()} loading={duplicating}>
          <Copy aria-hidden="true" />
          Duplicate
        </Button>

        <PrintButton label="Print / PDF" />

        {status === "draft" ? (
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>

      {notice ? (
        <Alert tone="success" title="Saved">
          {notice}
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" title="That action did not complete">
          {error}
        </Alert>
      ) : null}
{pending ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={pending.title}
          description={pending.description}
          consequence={pending.consequence}
          confirmLabel={pending.confirmLabel}
          onConfirm={async () => {
            const message = await changeStatus(pending.status);
            if (!message) setPending(null);
            return message;
          }}
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          open
          onOpenChange={setDeleteOpen}
          title="Delete this draft?"
          description="The draft and its line items are removed permanently."
          consequence="Only drafts can be deleted. Once a quotation is marked as sent it is kept as a record."
          confirmLabel="Delete draft"
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}