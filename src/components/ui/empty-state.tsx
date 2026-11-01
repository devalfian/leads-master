import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-subtle bg-surface/40 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-accent-soft">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="max-w-md text-[13px] leading-relaxed text-secondary">{description}</p>
      {actions ? <div className="mt-2 flex flex-wrap items-center justify-center gap-2">{actions}</div> : null}
    </div>
  );
}