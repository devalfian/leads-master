import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageHeader({
  breadcrumb,
  title,
  description,
  meta,
  actions,
  className,
}: {
  breadcrumb?: BreadcrumbItem[];
  title: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border-subtle px-5 py-6 md:px-8 lg:flex-row lg:items-start lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-[11px] text-muted">
              {breadcrumb.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                  {item.href ? (
                    <Link href={item.href} className="rounded hover:text-secondary">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-secondary">{item.label}</span>
                  )}
                  {index < breadcrumb.length - 1 ? (
                    <ChevronRight className="size-3 opacity-60" aria-hidden="true" />
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {title}
          </h1>
          {meta}
        </div>

        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-secondary">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
    </header>
  );
}