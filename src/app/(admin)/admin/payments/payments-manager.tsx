"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatDateWAT, formatNaira } from "@/lib/utils";
import { ProofUpload, type UploadedProof } from "@/app/(site)/enroll/proof-upload";
import { markMonthlyPaid, removeMonthlyPayment } from "./actions";

export type SubscriptionRow = {
  id: string;
  memberCode: string;
  name: string;
  teamName: string | null;
  guardianName: string;
  guardianPhone: string;
  payment: { id: string; amountKobo: number; paidAtIso: string | null } | null;
};

export function PaymentsManager({
  month,
  monthlyKobo,
  overdueNow,
  players,
}: {
  month: string;
  monthlyKobo: number;
  overdueNow: boolean;
  players: SubscriptionRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [marking, setMarking] = useState<SubscriptionRow | null>(null);
  const [amount, setAmount] = useState(String(monthlyKobo / 100));
  const [depositor, setDepositor] = useState("");
  const [proof, setProof] = useState<UploadedProof | null>(null);
  const [pending, startTransition] = useTransition();

  const paid = players.filter((p) => p.payment);
  const unpaid = players.filter((p) => !p.payment);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-step--1 font-semibold">
          Month
          <Input
            type="month"
            aria-label="Subscription month"
            className="h-10 w-auto"
            value={month}
            onChange={(e) => router.replace(`${pathname}?month=${e.target.value}`)}
          />
        </label>
        <p className="text-step--1 text-kit-soft">
          <span className="font-mono font-bold text-pitch">{paid.length}</span> paid ·{" "}
          <span className="font-mono font-bold text-kit">{unpaid.length}</span> unpaid ·
          fee {formatNaira(monthlyKobo)}
        </p>
      </div>

      {players.length === 0 ? (
        <EmptyState title="No active players yet — subscriptions start once players are accepted." />
      ) : (
        <div className="overflow-x-auto rounded-brand border border-line bg-white/60">
          <table className="w-full min-w-[720px] border-collapse text-step--1">
            <thead>
              <tr className="border-b-2 border-kit text-left">
                <th scope="col" className="px-3 py-2.5 font-semibold">Player</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Guardian</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Status</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Paid</th>
                <th scope="col" className="px-3 py-2.5 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {[...unpaid, ...paid].map((player) => (
                <tr key={player.id} className="border-b border-line last:border-0 hover:bg-kit/5">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">{player.name}</p>
                    <p className="font-mono text-[0.6875rem] text-kit-soft">
                      {player.memberCode}
                      {player.teamName && ` · ${player.teamName}`}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p>{player.guardianName}</p>
                    <p className="font-mono text-[0.75rem] text-kit-soft">{player.guardianPhone}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    {player.payment ? (
                      <Badge tone="green">Paid</Badge>
                    ) : overdueNow ? (
                      <Badge tone="red">Overdue</Badge>
                    ) : (
                      <Badge tone="amber">Unpaid</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {player.payment ? (
                      <span className="font-mono">
                        {formatNaira(player.payment.amountKobo)}
                        {player.payment.paidAtIso && (
                          <span className="ml-1 text-kit-soft">
                            · {formatDateWAT(new Date(player.payment.paidAtIso))}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {player.payment ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          startTransition(async () => {
                            const result = await removeMonthlyPayment(player.payment!.id);
                            if (result.ok) {
                              toast.success("Payment record removed.");
                              router.refresh();
                            } else {
                              toast.error(result.error);
                            }
                          })
                        }
                      >
                        Undo
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setMarking(player);
                          setAmount(String(monthlyKobo / 100));
                          setDepositor("");
                          setProof(null);
                        }}
                      >
                        Mark paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={marking !== null}
        onClose={() => setMarking(null)}
        title={`Record ${month} payment — ${marking?.name}`}
      >
        <div className="flex flex-col gap-4">
          <Field label="Amount paid (₦)" required>
            {(a11y) => (
              <Input {...a11y} type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            )}
          </Field>
          <Field label="Depositor name">
            {(a11y) => <Input {...a11y} value={depositor} onChange={(e) => setDepositor(e.target.value)} />}
          </Field>
          <div>
            <p className="mb-1.5 text-step--1 font-semibold">
              Proof of payment <span className="font-normal text-kit-soft">(optional)</span>
            </p>
            <ProofUpload proof={proof} onChange={setProof} />
          </div>
        </div>
        <DialogActions>
          <Button variant="secondary" onClick={() => setMarking(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            loading={pending}
            disabled={!amount || Number(amount) <= 0}
            onClick={() =>
              startTransition(async () => {
                if (!marking) return;
                const result = await markMonthlyPaid({
                  playerId: marking.id,
                  periodMonth: month,
                  amountKobo: Math.round(Number(amount) * 100),
                  depositorName: depositor || undefined,
                  proof: proof
                    ? { publicId: proof.publicId, url: proof.url, format: proof.format, bytes: proof.bytes }
                    : null,
                });
                setMarking(null);
                if (result.ok) {
                  toast.success("Payment recorded.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Record payment
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
