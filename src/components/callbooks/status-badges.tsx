import { CircleDot, CircleSlash, FileEdit, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CALLBOOK_STATUS_LABELS, type CallbookStatus } from "@/lib/callbooks/types";
import { getOutcome, outcomeToneClasses } from "@/lib/callbooks/outcomes";
import { cn } from "@/lib/utils";

export function CallbookStatusBadge({ status }: { status: CallbookStatus }) {
  if (status === "archived") {
    return (
      <Badge tone="neutral">
        <CircleSlash className="size-3" aria-hidden="true" />
        {CALLBOOK_STATUS_LABELS.archived}
      </Badge>
    );
  }
  if (status === "published") {
    return (
      <Badge tone="success">
        <Rocket className="size-3" aria-hidden="true" />
        {CALLBOOK_STATUS_LABELS.published}
      </Badge>
    );
  }
  return (
    <Badge tone="warning">
      <FileEdit className="size-3" aria-hidden="true" />
      {CALLBOOK_STATUS_LABELS.draft}
    </Badge>
  );
}

export function UnpublishedChangesBadge() {
  return (
    <Badge tone="info">
      <CircleDot className="size-3" aria-hidden="true" />
      Unpublished changes
    </Badge>
  );
}

export function OutcomeBadge({
  outcomeKey,
  className,
}: {
  outcomeKey: string | null;
  className?: string;
}) {
  const outcome = getOutcome(outcomeKey);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        outcomeToneClasses(outcomeKey),
        className,
      )}
    >
      {outcome ? outcome.label : "No result recorded"}
    </span>
  );
}

export function TerminalBadge() {
  return <Badge tone="neutral">Terminal step</Badge>;
}