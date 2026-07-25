"use client";

import { MoyoursCrest } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-pitch px-6 text-center text-chalk">
      <MoyoursCrest size={72} />
      <h1 className="font-display text-step-2">Something broke on our side.</h1>
      <p className="max-w-md text-step-0 text-chalk-dim">
        The page hit an unexpected error. Trying again usually fixes it — if it
        keeps happening, call us on 08099926480.
        {error.digest && (
          <span className="mt-2 block font-mono text-step--1">Error ref: {error.digest}</span>
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit"
      >
        Try again
      </button>
    </div>
  );
}
