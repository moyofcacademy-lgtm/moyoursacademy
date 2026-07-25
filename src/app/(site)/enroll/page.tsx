import type { Metadata } from "next";
import { getFees, getSetting } from "@/lib/settings";
import { EnrollFlow } from "./enroll-flow";

export const metadata: Metadata = {
  title: "Enroll your child",
  description:
    "Register your child at Moyours Sports Academy, Abuja — structured football training for boys and girls aged 4–18.",
};

export const dynamic = "force-dynamic";

export default async function EnrollPage() {
  const [fees, bank] = await Promise.all([getFees(), getSetting("bank")]);

  return (
    <div className="mx-auto max-w-2xl px-[var(--gutter)] py-10 sm:py-14">
      <EnrollFlow
        fees={{
          registrationKobo: fees.registrationKobo,
          jerseyKobo: fees.jerseyKobo,
          monthlyKobo: fees.monthlyKobo,
          initialTotalKobo: fees.initialTotalKobo,
        }}
        bank={bank}
      />
    </div>
  );
}
