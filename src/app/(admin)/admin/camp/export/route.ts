import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

function csvEscape(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Camp register as CSV — the digital version of the paper attendance sheet. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const rows = await prisma.campRegistration.findMany({
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  const header = [
    "Reference",
    "Participant",
    "Gender",
    "Date of birth",
    "Religion",
    "Nationality",
    "State",
    "Address",
    "Guardian",
    "Guardian phone",
    "Guardian email",
    "Payment method",
    "Payment status",
    "Amount",
    "Registered",
  ];

  const lines = rows.map((r) =>
    [
      r.reference,
      r.fullName,
      r.gender,
      r.dateOfBirth.toISOString().slice(0, 10),
      r.religion,
      r.nationality,
      r.state,
      r.address,
      r.guardianName,
      r.guardianPhone,
      r.guardianEmail,
      r.paymentMethod,
      r.paymentStatus,
      r.amountKobo != null ? formatNaira(r.amountKobo) : "",
      r.createdAt.toISOString(),
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moyours-summer-camp-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
