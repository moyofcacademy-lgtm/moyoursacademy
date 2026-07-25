import { cn } from "@/lib/utils";
import { useId, type ReactNode } from "react";

/**
 * Labeled form field with inline error — errors always render under the
 * field, never in a summary alert.
 */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-step--1 font-semibold text-kit">
        {label}
        {required && (
          <span aria-hidden className="text-red-600">
            {" "}
            *
          </span>
        )}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-step--1 text-kit-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-step--1 font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
