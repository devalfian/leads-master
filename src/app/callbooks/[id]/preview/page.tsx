import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CallbookPreview } from "@/components/callbooks/callbook-preview";
import { getCallbook } from "@/lib/callbooks/repository";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export const metadata = { title: "Preview conversation" };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let callbook: Awaited<ReturnType<typeof getCallbook>> = null;
  let error: string | null = null;

  try {
    callbook = await getCallbook(id);
  } catch (loadError) {
    error = describeDataError(loadError, "This Callbook could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="Callbook could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (!callbook) notFound();

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace" },
          { label: "Call Playbooks", href: "/callbooks" },
          { label: callbook.title, href: `/callbooks/${callbook.id}` },
          { label: "Preview" },
        ]}
        title="Preview"
        description="Walk through the current draft as a conversation. No call is recorded and no saved data changes."
        actions={
          <Button asChild variant="secondary">
            <Link href={`/callbooks/${callbook.id}`}>
              <ArrowLeft aria-hidden="true" />
              Back to builder
            </Link>
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-8">
        <CallbookPreview callbookId={callbook.id} title={callbook.title} graph={callbook.graph} />
      </div>
    </div>
  );
}