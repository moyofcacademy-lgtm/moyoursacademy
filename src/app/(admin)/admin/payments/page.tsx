import { prisma } from "@/lib/prisma";
import { getFees, getSetting } from "@/lib/settings";
import { currentPeriodMonth } from "@/lib/utils";
import { PaymentsManager } from "./payments-manager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : currentPeriodMonth();

  const [players, fees, overdueDay] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      orderBy: { joinedAt: "asc" },
      include: {
        registration: {
          select: {
            firstName: true,
            lastName: true,
            guardianName: true,
            guardianPhone: true,
            payments: {
              where: { type: "MONTHLY_SUBSCRIPTION", periodMonth: month },
              select: { id: true, status: true, amountKobo: true, paidAt: true },
            },
          },
        },
        team: { select: { name: true } },
      },
    }),
    getFees(),
    getSetting("subscriptionOverdueDay"),
  ]);

  const today = new Date();
  const isCurrentMonth = month === currentPeriodMonth();
  const overdueNow = isCurrentMonth && today.getDate() > overdueDay;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Monthly payments</h1>
      <p className="max-w-xl text-step--1 text-kit-soft">
        Subscription tracking per player. Unpaid players are flagged overdue
        after day {overdueDay} of the month (change this in Settings).
      </p>
      <PaymentsManager
        month={month}
        monthlyKobo={fees.monthlyKobo}
        overdueNow={overdueNow}
        players={players.map((p) => {
          const payment = p.registration.payments[0] ?? null;
          return {
            id: p.id,
            memberCode: p.memberCode,
            name: `${p.registration.firstName} ${p.registration.lastName}`,
            teamName: p.team?.name ?? null,
            guardianName: p.registration.guardianName,
            guardianPhone: p.registration.guardianPhone,
            payment: payment
              ? {
                  id: payment.id,
                  amountKobo: payment.amountKobo,
                  paidAtIso: payment.paidAt?.toISOString() ?? null,
                }
              : null,
          };
        })}
      />
    </div>
  );
}
