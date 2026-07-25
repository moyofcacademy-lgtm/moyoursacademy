import type { Metadata } from "next";
import { StatusChecker } from "./status-checker";

export const metadata: Metadata = {
  title: "Application status",
  description: "Check the progress of your Moyours Football Club Academy enrollment.",
  robots: { index: false },
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">Application status</h1>
      <p className="mt-3 text-step-0 text-kit-soft">
        Enter your application reference (from your confirmation email) or the
        guardian phone number you registered with.
      </p>
      <div className="mt-8">
        <StatusChecker initialQuery={ref ?? ""} />
      </div>
    </div>
  );
}
