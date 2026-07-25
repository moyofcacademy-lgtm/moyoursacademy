import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeWAT } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const where = {
    ...(params.actor ? { actorEmail: { contains: params.actor, mode: "insensitive" as const } } : {}),
    ...(params.action ? { action: { contains: params.action, mode: "insensitive" as const } } : {}),
  };

  const [entries, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ select: { action: true }, distinct: ["action"], orderBy: { action: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const merged = { ...params, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    return `/admin/audit?${next.toString()}`;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <h1 className="font-display text-step-2">Audit log</h1>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-step--1 font-semibold">
          Actor
          <input
            type="search"
            name="actor"
            defaultValue={params.actor ?? ""}
            placeholder="email contains…"
            className="h-10 rounded-brand border border-line bg-white/70 px-3 text-step-0 focus:border-pitch focus:outline-none focus:ring-2 focus:ring-gold/60"
          />
        </label>
        <label className="flex flex-col gap-1 text-step--1 font-semibold">
          Action
          <select
            name="action"
            defaultValue={params.action ?? ""}
            className="h-10 rounded-brand border border-line bg-white/70 px-3 text-step-0 focus:border-pitch focus:outline-none focus:ring-2 focus:ring-gold/60"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-brand border border-line px-4 text-step--1 font-semibold hover:border-kit"
        >
          Filter
        </button>
      </form>

      {entries.length === 0 ? (
        <EmptyState title="Nothing in the log for this filter. Admin actions record here automatically." />
      ) : (
        <div className="overflow-x-auto rounded-brand border border-line bg-white/60">
          <table className="w-full min-w-[720px] border-collapse text-step--1">
            <thead>
              <tr className="border-b-2 border-kit text-left">
                <th scope="col" className="px-3 py-2.5 font-semibold">When</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Actor</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Action</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Entity</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-line align-top last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[0.75rem] text-kit-soft">
                    {formatDateTimeWAT(entry.createdAt)}
                  </td>
                  <td className="px-3 py-2">{entry.actorEmail}</td>
                  <td className="px-3 py-2 font-mono text-[0.75rem] font-semibold">{entry.action}</td>
                  <td className="px-3 py-2 text-kit-soft">
                    {entry.entityType}
                    <span className="ml-1 font-mono text-[0.6875rem]">{entry.entityId.slice(0, 10)}…</span>
                  </td>
                  <td className="max-w-64 px-3 py-2 font-mono text-[0.6875rem] text-kit-soft">
                    {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-step--1">
          <p className="text-kit-soft">
            Page {page} of {totalPages} · {total} entries
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: String(page - 1) })} className="rounded-brand border border-line px-3 py-1.5 font-semibold hover:border-kit">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={href({ page: String(page + 1) })} className="rounded-brand border border-line px-3 py-1.5 font-semibold hover:border-kit">
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
