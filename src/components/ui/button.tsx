import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Gold is the loud accent — reserved for the primary action on a screen.
  primary:
    "bg-gold text-kit hover:brightness-105 active:brightness-95 border border-gold font-semibold",
  secondary:
    "bg-transparent text-current border border-line hover:border-current",
  ghost: "bg-transparent text-current border border-transparent hover:bg-kit/5",
  danger:
    "bg-transparent text-red-700 border border-red-300 hover:bg-red-50 hover:border-red-500",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-step--1",
  md: "h-10 px-4 text-step--1",
  lg: "h-12 px-6 text-step-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-brand transition-[background,border-color,filter] duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);
