import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getQuote } from "@/lib/quotes/repository";
import { loadQuoteLeadOptions } from "@/lib/quotes/options";
import { describeDataError } from "@/lib/data-error";
import type { QuoteLeadOption } from "@/lib/quotes/types";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let quote: Awaited<ReturnType<typeof getQuote>> = null;
  let error: string | null = null;

  try {
    quote = await getQuote(id);
  } catch (loadError) {
    error = describeDataError(loadError, "This quotation could not be loaded. Try again.");
  }

  if (error) {
    return (
      <div className="px-5 py-8 md:px-8">
        <Alert tone="danger" title="This quotation could not be loaded">
          {error}
        </Alert>
      </div>
    );
  }

  if (!quote) notFound();

  // A quotation that has left the building is a historical record.
  if (quote.status !== "draft") redirect(`/quotes/${quote.id}`);

  let leads: QuoteLeadOption[] = [];
  try {
    const options = await loadQuoteLeadOptions();
    leads = options.filter((option) => option.id === quote?.leadId);
  } catch (loadError) {
    error = describeDataError(loadError, "The client list could not be loaded. Try again.");
  }

  return (
    <div className="pb-16">
      <PageHeader
        breadcrumb={[
          { label: "Workspace", href: "/dashboard" },
          { label: "Quotes", href: "/quotes" },
          { label: quote.quoteNumber, href: `/quotes/${quote.id}` },
          { label: "Edit" },
        ]}
        title={`Edit ${quote.quoteNumber}`}
        description="Changes apply to this draft only. Once the quotation is marked as sent it becomes a locked record."
      />

      {error ? (
        <div className="px-5 py-6 md:px-8">
          <Alert tone="danger" title="The quotation form could not be prepared">
            {error}
          </Alert>
        </div>
      ) : leads.length === 0 ? (
        <div className="px-5 py-6 md:px-8">
          <Alert tone="warning" title="This quotation cannot be edited here">
            {quote.leadBusinessName} is archived, so its packages are not offered for editing.
            Restore the lead from Leads, or duplicate the quotation to start a new version.
          </Alert>
          <Button asChild variant="secondary" className="mt-3">
            <Link href={`/quotes/${quote.id}`}>Back to the quotation</Link>
          </Button>
        </div>
      ) : (
        <QuoteForm leads={leads} mode="edit" quote={quote} />
      )}
    </div>
  );
}