import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[10px] border border-border-subtle bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted transition-colors duration-150 focus:border-accent-soft focus:outline-none focus:ring-1 focus:ring-accent-soft/40 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn(fieldBase, "h-9", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[88px] resize-y leading-relaxed", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-9 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-[13px] font-medium text-secondary", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-relaxed text-muted", className)} {...props} />;
}