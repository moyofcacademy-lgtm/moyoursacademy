import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AGE_GROUPS } from "@/lib/constants";
import {
  buildRegistrationOrderBy,
  buildRegistrationWhere,
  REGISTRATIONS_PAGE_SIZE,
  type RegistrationListParams,
} from "@/lib/registrations-query";
import { cn } from "@/lib/utils";
import { RegistrationsTable } from "./registrations-table";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<RegistrationListParams>;
}) {
  const params = await searchParams;
  const where = buildRegistrationWhere(params);
  const page = Math.max(1, Number(params.page) || 1);

  const [rows, total, reviewCount, acceptedCount, rejectedCount, allCount] =
    await Promise.all([
      prisma.registration.findMany({
        where,
        orderBy: buildRegistrationOrderBy(params.sort),
        skip: (page - 1) * REGISTRATIONS_PAGE_SIZE,
        take: REGISTRATIONS_PAGE_SIZE,
        select: {
          id: true,
          reference: true,
          firstName: true,
          lastName: true,
          ageGroup: true,
          gender: true,
          guardianName: true,
          guardianPhone: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          payments: {
            where: { type: "INITIAL" },
            take: 1,
            select: { amountKobo: true, proofFormat: true },
          },
        },
      }),
      prisma.registration.count({ where }),
      prisma.registration.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.registration.count({ where: { status: "ACCEPTED" } }),
      prisma.registration.count({ where: { status: "REJECTED" } }),
      prisma.registration.count(),
    ]);

  const tabs = [
    { key: "review", label: "Awaiting review", count: reviewCount },
    { key: "accepted", label: "Accepted", count: acceptedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "all", label: "All", count: allCount },
  ];
  const activeTab = params.tab ?? "review";

  const query = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => v && k !== "page") as [string, string][],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-step-2">Registrations</h1>
        <a
          href={`/admin/registrations/export?${query.toString()}`}
          className="inline-flex h-10 items-center rounded-brand border border-line px-4 text-step--1 font-semibold hover:border-kit"
          download
        >
          Export CSV ({total})
        </a>
      </div>

      <nav aria-label="Registration status" className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((tab) => {
          const href = new URLSearchParams(query);
          href.set("tab", tab.key);
          const active = activeTab === tab.key || (tab.key === "review" && !params.tab);
          return (
            <Link
              key={tab.key}
              href={`/admin/registrations?${href.toString()}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-step--1 font-semibold",
                active
                  ? "border-gold text-kit"
                  : "border-transparent text-kit-soft hover:text-kit",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[0.6875rem]",
                  active ? "bg-pitch text-chalk" : "bg-kit/10",
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      <RegistrationsTable
        rows={rows.map((r) => ({
          id: r.id,
          reference: r.reference,
          playerName: `${r.firstName} ${r.lastName}`,
          ageGroup: r.ageGroup,
          gender: r.gender,
          guardianName: r.guardianName,
          guardianPhone: r.guardianPhone,
          status: r.status,
          paymentStatus: r.paymentStatus,
          amountKobo: r.payments[0]?.amountKobo ?? null,
          proofFormat: r.payments[0]?.proofFormat ?? null,
          submittedAtIso: r.createdAt.toISOString(),
        }))}
        total={total}
        page={page}
        pageSize={REGISTRATIONS_PAGE_SIZE}
        ageGroups={AGE_GROUPS.map((g) => g.key)}
        activeTab={activeTab}
      />
    </div>
  );
}
