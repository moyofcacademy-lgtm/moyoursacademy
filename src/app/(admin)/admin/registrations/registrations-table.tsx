"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { cn, formatDateTimeWAT, formatNaira, timeAgo } from "@/lib/utils";
import { bulkAcceptRegistrations, deleteRegistration } from "./actions";

export type RegistrationRow = {
  id: string;
  reference: string;
  playerName: string;
  ageGroup: string | null;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  status: string;
  paymentStatus: string;
  amountKobo: number | null;
  proofFormat: string | null;
  submittedAtIso: string;
};

const columnHelper = createColumnHelper<RegistrationRow>();

export function RegistrationsTable({
  rows,
  total,
  page,
  pageSize,
  ageGroups,
  activeTab,
}: {
  rows: RegistrationRow[];
  total: number;
  page: number;
  pageSize: number;
  ageGroups: string[];
  activeTab: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [removing, setRemoving] = useState<RegistrationRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  // Debounced server-side search.
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const canBulkAccept = activeTab === "review" || activeTab === "all";

  const columns = useMemo(
    () => [
      ...(canBulkAccept
        ? [
            columnHelper.display({
              id: "select",
              header: ({ table }) => (
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  className="size-4 accent-[#0B3D2C]"
                  checked={table.getIsAllRowsSelected()}
                  onChange={table.getToggleAllRowsSelectedHandler()}
                />
              ),
              cell: ({ row }) =>
                row.original.status === "SUBMITTED" || row.original.status === "UNDER_REVIEW" ? (
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.original.playerName}`}
                    className="size-4 accent-[#0B3D2C]"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                  />
                ) : null,
            }),
          ]
        : []),
      columnHelper.accessor("playerName", {
        header: "Player",
        cell: (info) => (
          <Link
            href={`/admin/registrations/${info.row.original.id}`}
            className="font-semibold underline-offset-2 hover:underline"
          >
            {info.getValue()}
            <span className="ml-2 font-mono text-[0.6875rem] font-normal text-kit-soft">
              {info.row.original.ageGroup ?? "—"}
            </span>
          </Link>
        ),
      }),
      columnHelper.accessor("guardianName", {
        header: "Guardian",
        cell: (info) => (
          <div>
            <p>{info.getValue()}</p>
            <p className="font-mono text-[0.75rem] text-kit-soft">{info.row.original.guardianPhone}</p>
          </div>
        ),
      }),
      columnHelper.accessor("amountKobo", {
        header: "Amount",
        cell: (info) => {
          const v = info.getValue();
          return v == null ? "—" : <span className="font-mono">{formatNaira(v)}</span>;
        },
      }),
      columnHelper.accessor("proofFormat", {
        header: "Proof",
        cell: (info) =>
          info.getValue() ? (
            <Link
              href={`/admin/registrations/${info.row.original.id}`}
              className="inline-flex items-center rounded-brand border border-line px-2 py-1 font-mono text-[0.6875rem] font-bold uppercase hover:border-kit"
            >
              {info.getValue()}
            </Link>
          ) : (
            "—"
          ),
      }),
      columnHelper.accessor("submittedAtIso", {
        header: "Submitted",
        cell: (info) => (
          <span title={formatDateTimeWAT(new Date(info.getValue()))} className="text-kit-soft">
            {timeAgo(new Date(info.getValue()))}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button variant="danger" size="sm" onClick={() => setRemoving(row.original)}>
            Delete
          </Button>
        ),
      }),
    ],
    [canBulkAccept],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: (row) =>
      row.original.status === "SUBMITTED" || row.original.status === "UNDER_REVIEW",
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(target));
    return `${pathname}?${next.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            const value = e.target.value;
            searchTimer.current = setTimeout(() => setParam("q", value), 350);
          }}
          placeholder="Search name, reference, code, phone, email…"
          aria-label="Search registrations"
          className="lg:col-span-2"
        />
        <Select
          aria-label="Filter by age group"
          value={searchParams.get("ageGroup") ?? ""}
          onChange={(e) => setParam("ageGroup", e.target.value)}
        >
          <option value="">All age groups</option>
          {ageGroups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by gender"
          value={searchParams.get("gender") ?? ""}
          onChange={(e) => setParam("gender", e.target.value)}
        >
          <option value="">All genders</option>
          <option value="MALE">Boys</option>
          <option value="FEMALE">Girls</option>
        </Select>
        <Select
          aria-label="Filter by payment status"
          value={searchParams.get("payment") ?? ""}
          onChange={(e) => setParam("payment", e.target.value)}
        >
          <option value="">Any payment status</option>
          <option value="PROOF_SUBMITTED">Proof submitted</option>
          <option value="AWAITING_PROOF">Awaiting proof</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Select
          aria-label="Sort"
          value={searchParams.get("sort") ?? "submitted-desc"}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="submitted-desc">Newest first</option>
          <option value="submitted-asc">Oldest first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-step--1 text-kit-soft">
        <label className="flex items-center gap-2">
          From
          <Input
            type="date"
            aria-label="Submitted from"
            className="h-9 w-auto"
            value={searchParams.get("from") ?? ""}
            onChange={(e) => setParam("from", e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          to
          <Input
            type="date"
            aria-label="Submitted to"
            className="h-9 w-auto"
            value={searchParams.get("to") ?? ""}
            onChange={(e) => setParam("to", e.target.value)}
          />
        </label>
        {selectedRows.length > 0 && (
          <Button size="sm" className="ml-auto" onClick={() => setConfirmBulk(true)}>
            Accept {selectedRows.length} selected
          </Button>
        )}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <EmptyState title="No registrations match this view. New applications appear here as guardians enroll." />
      ) : (
        <div className="overflow-x-auto rounded-brand border border-line bg-white/60">
          <table className="w-full min-w-[760px] border-collapse text-step--1">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b-2 border-kit text-left">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} scope="col" className="px-3 py-2.5 font-semibold">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("border-b border-line last:border-0 hover:bg-kit/5", row.getIsSelected() && "bg-gold/10")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-step--1">
          <p className="text-kit-soft">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className="rounded-brand border border-line px-3 py-1.5 font-semibold hover:border-kit">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageHref(page + 1)} className="rounded-brand border border-line px-3 py-1.5 font-semibold hover:border-kit">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* Bulk accept confirmation */}
      <Dialog
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        title={`Accept ${selectedRows.length} player${selectedRows.length === 1 ? "" : "s"}?`}
      >
        <p className="text-step--1 text-kit-soft">
          Each player gets a member code, and each guardian receives the
          confirmation email:
        </p>
        <ul className="mt-3 max-h-48 overflow-y-auto rounded-brand border border-line bg-white/70 p-3 text-step--1">
          {selectedRows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3 py-1">
              <span className="font-semibold">{row.playerName}</span>
              <span className="font-mono text-kit-soft">{row.reference}</span>
            </li>
          ))}
        </ul>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmBulk(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await bulkAcceptRegistrations(selectedRows.map((r) => r.id));
                setConfirmBulk(false);
                setSelection({});
                if (result.failed > 0) {
                  toast.error(`${result.accepted} accepted, ${result.failed} failed — check and retry.`);
                } else {
                  toast.success(
                    result.skipped > 0
                      ? `${result.accepted} players accepted (${result.skipped} were already accepted).`
                      : `${result.accepted} player${result.accepted === 1 ? "" : "s"} accepted.`,
                  );
                }
                router.refresh();
              })
            }
          >
            Accept players
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} title={`Delete ${removing?.playerName}?`}>
        <p className="text-step--1 text-kit-soft">
          This permanently removes the registration, payment proof, notifications, and linked player record if one exists.
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
                const result = await deleteRegistration(removing.id);
                setRemoving(null);
                if (result.ok) {
                  toast.success("Registration deleted.");
                  setSelection({});
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
