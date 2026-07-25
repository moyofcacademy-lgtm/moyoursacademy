import "server-only";
import type { Prisma } from "@/generated/prisma/client";

export type RegistrationListParams = {
  tab?: string; // review | accepted | rejected | all
  q?: string;
  ageGroup?: string;
  gender?: string;
  payment?: string;
  from?: string;
  to?: string;
  sort?: string; // submitted-desc | submitted-asc | name-asc | name-desc
  page?: string;
};

export const REGISTRATIONS_PAGE_SIZE = 25;

export function buildRegistrationWhere(
  params: RegistrationListParams,
): Prisma.RegistrationWhereInput {
  const where: Prisma.RegistrationWhereInput = {};

  switch (params.tab) {
    case "accepted":
      where.status = "ACCEPTED";
      break;
    case "rejected":
      where.status = "REJECTED";
      break;
    case "all":
      break;
    default:
      where.status = { in: ["SUBMITTED", "UNDER_REVIEW"] };
  }

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { memberCode: { contains: q, mode: "insensitive" } },
      { guardianPhone: { contains: q.replace(/^0/, "") } },
      { guardianName: { contains: q, mode: "insensitive" } },
      { guardianEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.ageGroup) where.ageGroup = params.ageGroup;
  if (params.gender === "MALE" || params.gender === "FEMALE") {
    where.gender = params.gender;
  }
  if (
    params.payment === "AWAITING_PROOF" ||
    params.payment === "PROOF_SUBMITTED" ||
    params.payment === "VERIFIED" ||
    params.payment === "REJECTED"
  ) {
    where.paymentStatus = params.payment;
  }

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(`${params.from}T00:00:00Z`);
    if (params.to) where.createdAt.lte = new Date(`${params.to}T23:59:59Z`);
  }

  return where;
}

export function buildRegistrationOrderBy(
  sort?: string,
): Prisma.RegistrationOrderByWithRelationInput[] {
  switch (sort) {
    case "submitted-asc":
      return [{ createdAt: "asc" }];
    case "name-asc":
      return [{ lastName: "asc" }, { firstName: "asc" }];
    case "name-desc":
      return [{ lastName: "desc" }, { firstName: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}
