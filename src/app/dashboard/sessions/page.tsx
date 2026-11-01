import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SessionList } from "@/components/session-planner/session-list";
import { listSessions } from "@/lib/guides/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Session Planner" };

export default async function SessionsPage() {
  let sessions: Awaited<ReturnType<typeof listSessions>> = [];
  let error: string | null = null;

  try {
    sessions = await listSessions();
  } catch (loadError) {
    error = describeDataError(loadError, "Your sessions could not be loaded. Try again.");
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace" }, { label: "Session Planner" }]}
        title="Session Planner"
        description="Saved calling sessions, newest first. Each one keeps the schedule, prices and guide references it was created with."
        actions={
          <Button asChild>
            <Link href="/dashboard/sessions/new">
              <Plus aria-hidden="true" />
              Create session
            </Link>
          </Button>
        }
      />

      <div className="px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="Sessions could not be loaded">
            {error}
          </Alert>
        ) : (
          <SessionList sessions={sessions} />
        )}
      </div>
    </div>
  );
}