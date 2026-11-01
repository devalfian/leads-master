import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_STYLES: Record<AlertTone, { wrapper: string; icon: string }> = {
  success: { wrapper: "border-success/30 bg-success/10 text-success", icon: "text-success" },
  warning: { wrapper: "border-warning/30 bg-warning/10 text-warning", icon: "text-warning" },
  danger: { wrapper: "border-danger/30 bg-danger/10 text-danger", icon: "text-danger" },
  info: { wrapper: "border-info/30 bg-info/10 text-info", icon: "text-info" },
  neutral: { wrapper: "border-border-subtle bg-surface-elevated text-secondary", icon: "text-muted" },
};

const TONE_ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  neutral: Info,
} as const;

export function Alert({
  tone = "neutral",
  title,
  children,
  className,
  actions,
}: {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  const Icon = TONE_ICONS[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-2.5 rounded-[10px] border px-3.5 py-3", styles.wrapper, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", styles.icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{title}</p>
        {children ? <div className="mt-1 text-[12px] leading-relaxed opacity-90">{children}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}