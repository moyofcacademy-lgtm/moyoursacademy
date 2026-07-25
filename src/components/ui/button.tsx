import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Gold is the loud accent — reserved for the primary action on a screen.
  primary:
    "bg-gold text-kit border border-gold font-semibold shadow-sm hover:brightness-105 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:brightness-95 active:shadow-sm motion-reduce:hover:translate-y-0",
  secondary:
    "bg-transparent text-current border border-line hover:border-current hover:bg-kit/[0.03]",
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
          "inline-flex items-center justify-center gap-2 rounded-brand transition-[background,border-color,filter,transform,box-shadow] duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading && (
          // a football spins while the request is in flight
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
            className="size-4 shrink-0 animate-spin motion-reduce:animate-pulse"
          >
            <circle cx="12" cy="12" r="9.2" />
            <path d="M12 7.6 16.2 10.7 14.6 15.6 9.4 15.6 7.8 10.7Z" fill="currentColor" fillOpacity="0.25" />
            <path d="M12 7.6V2.8M16.2 10.7l4.6-1.5M14.6 15.6l2.8 3.9M9.4 15.6l-2.8 3.9M7.8 10.7 3.2 9.2" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
