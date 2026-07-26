import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { formatNaira } from "@/lib/utils";
import { CampManager } from "./camp-manager";

export const dynamic = "force-dynamic";

export default async function AdminCampPage() {
  const [registrations, camp] = await Promise.all([
    prisma.campRegistration.findMany({ orderBy: { createdAt: "desc" } }),
    getSetting("camp"),
  ]);

  const paid = registrations.filter((r) => r.paymentStatus === "VERIFIED").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-step-2">Summer camp</h1>
          <p className="mt-1 text-step--1 text-kit-soft">
            {camp.name} · {camp.venue} · fee {formatNaira(camp.feeKobo)}
          </p>
        </div>
        <a
          href="/admin/camp/export"
          download
          className="inline-flex h-10 items-center rounded-brand border border-line px-4 text-step--1 font-semibold hover:border-kit"
        >
          Export register ({registrations.length})
        </a>
      </div>

      <dl className="grid grid-cols-3 gap-4">
        {[
          { label: "Registered", value: registrations.length },
          { label: "Paid", value: paid },
          { label: "Unpaid", value: registrations.length - paid },
        ].map((stat) => (
          <div key={stat.label} className="rule-gold rounded-b-brand border border-line bg-white/60 p-4">
            <dd className="tabular font-mono text-step-2 font-bold text-pitch">{stat.value}</dd>
            <dt className="text-step--1 text-kit-soft">{stat.label}</dt>
          </div>
        ))}
      </dl>

      <CampManager
        rows={registrations.map((r) => ({
          id: r.id,
          reference: r.reference,
          fullName: r.fullName,
          gender: r.gender,
          dateOfBirthIso: r.dateOfBirth.toISOString(),
          guardianName: r.guardianName,
          guardianPhone: r.guardianPhone,
          guardianEmail: r.guardianEmail,
          paymentMethod: r.paymentMethod,
          paymentStatus: r.paymentStatus,
          amountKobo: r.amountKobo,
          proofUrl: r.proofUrl,
          internalNotes: r.internalNotes ?? "",
          createdAtIso: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
