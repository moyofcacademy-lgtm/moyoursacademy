import { z } from "zod";
import { ageAt } from "@/lib/constants";
import { normalizeNgPhone } from "@/lib/utils";

/**
 * Summer camp registration — mirrors the academy's paper form: guardian
 * details, participant personal information, payment method, declaration.
 * Camp accepts ages 2–17 (wider than the academy's 4–18).
 */
export function campFormSchema(ageMin: number, ageMax: number) {
  return z.object({
    // Parent / guardian
    guardianName: z.string().trim().min(2, "Enter the parent/guardian's name").max(80),
    guardianPhone: z
      .string()
      .trim()
      .min(1, "Enter the parent/guardian's phone number")
      .transform((value, ctx) => {
        const normalized = normalizeNgPhone(value);
        if (!normalized) {
          ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian mobile number, e.g. 0913 958 3669" });
          return z.NEVER;
        }
        return normalized;
      }),
    guardianEmail: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email — your confirmation goes here")),

    // Participant
    fullName: z.string().trim().min(3, "Enter the participant's full name").max(100),
    gender: z.enum(["MALE", "FEMALE"], { error: "Select the participant's gender" }),
    dateOfBirth: z
      .string()
      .min(1, "Enter the participant's date of birth")
      .transform((value, ctx) => {
        const date = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(date.getTime())) {
          ctx.addIssue({ code: "custom", message: "Enter a valid date" });
          return z.NEVER;
        }
        const age = ageAt(date);
        if (age < ageMin || age > ageMax) {
          ctx.addIssue({
            code: "custom",
            message: `Camp is for ages ${ageMin}–${ageMax} (this date makes them ${age})`,
          });
          return z.NEVER;
        }
        return value;
      }),
    address: z.string().trim().min(5, "Enter the home address").max(300),
    religion: z.string().trim().max(60).optional().or(z.literal("")),
    nationality: z.string().trim().max(60).optional().or(z.literal("")),
    state: z.string().trim().max(60).optional().or(z.literal("")),

    // Payment
    paymentMethod: z.enum(["CASH", "TRANSFER"], { error: "Choose how you're paying" }),
    proof: z
      .object({
        proofPublicId: z.string().min(1),
        proofUrl: z.string().min(1),
        proofFormat: z.string().min(1),
        proofBytes: z.number().int().positive(),
      })
      .nullable()
      .optional(),

    // Declaration — verbatim from the registration form
    consentDeclaration: z.literal(true, {
      error: "Tick the declaration to complete registration",
    }),
  });
}

export type CampFormInput = z.input<ReturnType<typeof campFormSchema>>;
