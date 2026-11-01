import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CallbookLibrary } from "@/components/callbooks/callbook-library";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { listCallbooks } from "@/lib/callbooks/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export default async function CallbooksPage() {
  let callbooks: Awaited<ReturnType<typeof listCallbooks>> = [];
  let error: string | null = null;

  try {
    callbooks = await listCallbooks();
  } catch (loadError) {
    error = describeDataError(loadError, "Your Callbooks could not be loaded. Try again.");
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[{ label: "Workspace" }, { label: "Call Playbooks" }]}
        title="Call Playbooks"
        description="Create structured conversation guides for every prospect scenario."
        actions={
          <Button asChild>
            <Link href="/callbooks/new">
              <Plus aria-hidden="true" />
              Create Callbook
            </Link>
          </Button>
        }
      />

      <div className="px-5 py-6 md:px-8">
        {error ? (
          <Alert tone="danger" title="Callbooks could not be loaded">
            {error}
          </Alert>
        ) : (
          <CallbookLibrary callbooks={callbooks} />
        )}
      </div>
    </div>
  );
}