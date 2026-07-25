import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function audit({
  actor,
  action,
  entityType,
  entityId,
  metadata,
  tx,
}: {
  actor: { id: string; email: string };
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
  /** pass the transaction client to log atomically with the change */
  tx?: Prisma.TransactionClient;
}): Promise<void> {
  let ipAddress: string | null = null;
  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    // outside a request scope (scripts, tests)
  }
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      actorId: actor.id,
      actorEmail: actor.email,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress,
    },
  });
}
