import Link from "next/link";
import { MoyoursCrest } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-pitch px-6 text-center text-chalk">
      <MoyoursCrest size={72} />
      <p className="font-mono text-step-3 font-bold text-gold">4–0–4</p>
      <h1 className="font-display text-step-2">That page went out of play.</h1>
      <p className="max-w-md text-step-0 text-chalk-dim">
        The link may be old, or the page may have moved. The homepage has
        everything — fixtures, results, and enrollment.
      </p>
      <Link
        href="/"
        className="inline-flex h-12 items-center rounded-brand bg-gold px-6 text-step-0 font-semibold text-kit"
      >
        Back to the homepage
      </Link>
    </div>
  );
}
