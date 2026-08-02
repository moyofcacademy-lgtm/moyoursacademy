"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { ageAt } from "@/lib/constants";
import { formatDateTimeWAT } from "@/lib/utils";
import { deleteCampRegistration, markCampPaid, unmarkCampPaid } from "./actions";

export type CampRow = {
  id: string;
  reference: string;
  fullName: string;
  gender: string;
  dateOfBirthIso: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  paymentMethod: string;
  paymentStatus: string;
  amountKobo: number | null;
  proofUrl: string | null;
  internalNotes: string;
  createdAtIso: string;
};

export function CampManager({ rows }: { rows: CampRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [paidFilter, setPaidFilter] = useState("");
  const [removing, setRemoving] = useState<CampRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (paidFilter === "paid" && r.paymentStatus !== "VERIFIED") return false;
      if (paidFilter === "unpaid" && r.paymentStatus === "VERIFIED") return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.guardianName.toLowerCase().includes(q) ||
        r.guardianPhone.includes(q)
      );
    });
  }, [rows, query, paidFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          type="search"
          aria-label="Search camp registrations"
          placeholder="Search name, reference, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:col-span-2"
        />
        <Select aria-label="Filter by payment" value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}>
          <option value="">Everyone</option>
          <option value="unpaid">Unpaid only</option>
          <option value="paid">Paid only</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No camp registrations in this view — they appear here the moment a parent registers." />
      ) : (
        <div className="overflow-x-auto rounded-brand border border-line bg-white/60">
          <table className="w-full min-w-[860px] border-collapse text-step--1">
            <thead>
              <tr className="border-b-2 border-kit text-left">
                <th scope="col" className="px-3 py-2.5 font-semibold">Participant</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Guardian</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Method</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Payment</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Registered</th>
                <th scope="col" className="px-3 py-2.5 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-line align-middle last:border-0 hover:bg-kit/5">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">
                      {row.fullName}
                      <span className="ml-2 font-mono text-[0.6875rem] font-normal text-kit-soft">
                        {ageAt(new Date(row.dateOfBirthIso))}y · {row.gender === "MALE" ? "Boy" : "Girl"}
                      </span>
                    </p>
                    <p className="font-mono text-[0.6875rem] text-kit-soft">{row.reference}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p>{row.guardianName}</p>
                    <p className="font-mono text-[0.75rem] text-kit-soft">{row.guardianPhone}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    {row.paymentMethod === "CASH" ? "Cash at venue" : "Transfer"}
                    {row.proofUrl && (
                      <a
                        href={`/admin/camp/${row.id}/proof`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 inline-flex items-center gap-1 rounded-brand border border-line px-1.5 py-0.5 font-mono text-[0.625rem] font-bold uppercase text-pitch underline-offset-2 hover:border-pitch hover:underline"
                      >
                        View proof ↗
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.paymentStatus === "VERIFIED" ? (
                      <Badge tone="green">Paid</Badge>
                    ) : row.paymentStatus === "PROOF_SUBMITTED" ? (
                      <Badge tone="amber">Check proof</Badge>
                    ) : (
                      <Badge tone="outline">Unpaid</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-kit-soft" title={formatDateTimeWAT(new Date(row.createdAtIso))}>
                    {formatDateTimeWAT(new Date(row.createdAtIso))}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      {row.paymentStatus === "VERIFIED" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await unmarkCampPaid(row.id);
                              if (result.ok) {
                                toast.success("Marked unpaid.");
                                router.refresh();
                              } else toast.error(result.error);
                            })
                          }
                        >
                          Undo
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await markCampPaid(row.id);
                              if (result.ok) {
                                toast.success(`${row.fullName} marked paid.`);
                                router.refresh();
                              } else toast.error(result.error);
                            })
                          }
                        >
                          Mark paid
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => setRemoving(row)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={`Delete ${removing?.fullName}?`}>
        <p className="text-step--1 text-kit-soft">
          This permanently removes the camp registration and any uploaded payment proof.
        </p>
        <DialogActions>
          <Button variant="secondary" onClick={() => setRemoving(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                if (!removing) return;
                const result = await deleteCampRegistration(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Camp registration deleted.");
                  router.refresh();
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            Delete registration
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
