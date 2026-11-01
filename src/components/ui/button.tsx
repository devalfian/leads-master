import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent-hover",
        secondary:
          "border border-border-subtle bg-surface-elevated text-foreground hover:bg-[#232a3c]",
        outline:
          "border border-border-subtle bg-transparent text-secondary hover:border-accent-soft/60 hover:text-foreground",
        ghost: "bg-transparent text-secondary hover:bg-surface-elevated hover:text-foreground",
        danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/40",
        success: "bg-success/15 text-success hover:bg-success/25 border border-success/40",
        link: "bg-transparent text-accent-soft underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-[13px] [&_svg]:size-4",
        md: "h-9 px-4 [&_svg]:size-4",
        lg: "h-11 px-5 text-[15px] [&_svg]:size-4",
        xl: "h-12 px-6 text-base [&_svg]:size-5",
        icon: "h-9 w-9 [&_svg]:size-4",
        "icon-sm": "h-7 w-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { buttonVariants };