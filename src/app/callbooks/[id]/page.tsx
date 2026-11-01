import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CallbookBuilder } from "@/components/callbooks/builder/callbook-builder";
import { getCallbook } from "@/lib/callbooks/repository";
import { loadCallbookMarketOptions } from "@/lib/callbooks/guide-options";
import type { CallbookMarketOption } from "@/lib/callbooks/types";
import { describeDataError } from "@/lib/data-error";

export const dynamic = "force-dynamic";

export default async function CallbookBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ context?: string; lead?: string }>;
}) {
  const { id } = await params;
  const { context, lead } = await searchParams;

  let callbook: Awaited<ReturnType<typeof getCallbook>> = null;
  let markets: CallbookMarketOption[] = [];
  let error: string | null = null;

  try {
    [callbook, markets] = await Promise.all([getCallbook(id), loadCallbookMarketOptions()]);
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
    <>
      <div className="border-b border-border-subtle px-5 py-2 md:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/callbooks">
            <ArrowLeft aria-hidden="true" />
            All Callbooks
          </Link>
        </Button>
      </div>
      <CallbookBuilder
        callbook={callbook}
        markets={markets}
        contextSessionId={context?.trim() || null}
        leadId={lead?.trim() || null}
      />
    </>
  );
}