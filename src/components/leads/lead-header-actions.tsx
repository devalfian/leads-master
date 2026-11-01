"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, FileText, Globe, Pencil, PhoneCall, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LogCallDialog } from "@/components/leads/log-call-dialog";
import { apiDelete, apiPatch } from "@/lib/api/client";

export function LeadHeaderActions({
  leadId,
  businessName,
  doNotContact,
  archived,
  website,
  packages,
  callbooks,
}: {
  leadId: string;
  businessName: string;
  doNotContact: boolean;
  archived: boolean;
  website: string | null;
  packages: Array<{ id: string; label: string }>;
  callbooks: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleArchive() {
    setBusy(true);
    setError(null);
    const result = await apiPatch(`/api/leads/${leadId}`, { archived: !archived });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  async function remove(): Promise<string | null> {
    const result = await apiDelete(`/api/leads/${leadId}`);
    if (!result.ok) return result.error.message;
    router.push("/leads");
    router.refresh();
    return null;
  }

  return (
    <div className="space-y-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setLogOpen(true)}>
          <PhoneCall aria-hidden="true" />
          Log call
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/quotes/new?lead=${leadId}`}>
            <FileText aria-hidden="true" />
            New quote
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/leads/${leadId}/edit`}>
            <Pencil aria-hidden="true" />
            Edit lead
          </Link>
        </Button>
        {website ? (
          <Button asChild variant="outline">
            <a href={website} target="_blank" rel="noreferrer noopener">
              <Globe aria-hidden="true" />
              Open website
            </a>
          </Button>
        ) : null}
        <Button variant="outline" onClick={toggleArchive} loading={busy}>
          {archived ? <RotateCcw aria-hidden="true" /> : <Archive aria-hidden="true" />}
          {archived ? "Restore" : "Archive"}
        </Button>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      </div>

      {error ? <Alert tone="danger" title="That action did not complete">{error}</Alert> : null}

      {logOpen ? (
        <LogCallDialog
          leadId={leadId}
          businessName={businessName}
          doNotContact={doNotContact}
          packages={packages}
          callbooks={callbooks}
          open
          onOpenChange={setLogOpen}
        />
      ) : null}

      {deleteOpen ? (
        <ConfirmDialog
          open
          onOpenChange={setDeleteOpen}
          title="Delete this lead?"
          description={`${businessName} will be removed from your lead list.`}
          consequence="Deletion is refused while the lead has call history — archive it instead so the calls stay in Call History."
          confirmLabel="Delete lead"
          onConfirm={remove}
        />
      ) : null}
    </div>
  );
}