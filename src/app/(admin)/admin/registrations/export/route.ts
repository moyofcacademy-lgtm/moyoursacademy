import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildRegistrationOrderBy,
  buildRegistrationWhere,
  type RegistrationListParams,
} from "@/lib/registrations-query";
import { formatNaira } from "@/lib/utils";

function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Export the current filtered view of registrations as CSV (Excel-friendly). */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const params: RegistrationListParams = {
    tab: sp.get("tab") ?? undefined,
    q: sp.get("q") ?? undefined,
    ageGroup: sp.get("ageGroup") ?? undefined,
    gender: sp.get("gender") ?? undefined,
    payment: sp.get("payment") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    sort: sp.get("sort") ?? undefined,
  };

  const rows = await prisma.registration.findMany({
    where: buildRegistrationWhere(params),
    orderBy: buildRegistrationOrderBy(params.sort),
    take: 5000,
    include: {
      payments: { where: { type: "INITIAL" }, take: 1 },
    },
  });

  const header = [
    "Reference",
    "Member code",
    "First name",
    "Last name",
    "Date of birth",
    "Gender",
    "Age group",
    "Position",
    "School",
    "Guardian",
    "Guardian phone",
    "Guardian email",
    "Address",
    "Status",
    "Payment status",
    "Amount",
    "Depositor",
    "Submitted",
  ];

  const lines = rows.map((r) =>
    [
      r.reference,
      r.memberCode,
      r.firstName,
      r.lastName,
      r.dateOfBirth.toISOString().slice(0, 10),
      r.gender,
      r.ageGroup,
      r.preferredPosition,
      r.schoolName,
      r.guardianName,
      r.guardianPhone,
      r.guardianEmail,
      r.address,
      r.status,
      r.paymentStatus,
      r.payments[0] ? formatNaira(r.payments[0].amountKobo) : "",
      r.payments[0]?.depositorName ?? "",
      r.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(","),
  );

  // BOM so Excel opens UTF-8 (₦, names) correctly.
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moyours-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
