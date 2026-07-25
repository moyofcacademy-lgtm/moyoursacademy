import { z } from "zod";
import { ageAt, MAX_AGE, MIN_AGE, POSITIONS } from "@/lib/constants";
import { normalizeNgPhone } from "@/lib/utils";

const ngPhone = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${label}`)
    .transform((value, ctx) => {
      const normalized = normalizeNgPhone(value);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid Nigerian mobile number, e.g. 0801 234 5678",
        });
        return z.NEVER;
      }
      return normalized;
    });

const optionalNgPhone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return undefined;
    const normalized = normalizeNgPhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid Nigerian mobile number, or leave it empty",
      });
      return z.NEVER;
    }
    return normalized;
  })
  .optional();

const name = (label: string) =>
  z.string().trim().min(2, `Enter the ${label}`).max(80, "Keep this under 80 characters");

export const registrationFormSchema = z.object({
  // Player
  firstName: name("player's first name"),
  lastName: name("player's last name"),
  dateOfBirth: z
    .string()
    .min(1, "Enter the player's date of birth")
    .transform((value, ctx) => {
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date" });
        return z.NEVER;
      }
      const age = ageAt(date);
      if (age < MIN_AGE || age > MAX_AGE) {
        ctx.addIssue({
          code: "custom",
          message: `Players must be between ${MIN_AGE} and ${MAX_AGE} years old (this date makes them ${age})`,
        });
        return z.NEVER;
      }
      return value;
    }),
  gender: z.enum(["MALE", "FEMALE"], { error: "Select the player's gender" }),
  preferredPosition: z.enum(POSITIONS).optional().or(z.literal("")),
  medicalNotes: z.string().trim().max(1000).optional(),
  schoolName: z.string().trim().max(120).optional(),

  // Guardian
  guardianName: name("guardian's full name"),
  guardianPhone: ngPhone("guardian's phone number"),
  guardianAltPhone: optionalNgPhone,
  guardianEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address — we send your confirmation here")),
  guardianRelationship: z.string().trim().max(40).optional(),
  address: z.string().trim().min(5, "Enter your home address").max(300),

  // Emergency
  emergencyContactName: z.string().trim().max(80).optional(),
  emergencyContactPhone: optionalNgPhone,

  // Consents — all three required
  consentMedical: z.literal(true, {
    error: "Tick this to confirm we may seek medical help in an emergency",
  }),
  consentMedia: z.literal(true, {
    error: "Tick this to consent to training and match photography",
  }),
  consentTerms: z.literal(true, {
    error: "Tick this to accept the academy's terms",
  }),
});

export type RegistrationFormInput = z.input<typeof registrationFormSchema>;
export type RegistrationFormData = z.output<typeof registrationFormSchema>;

export const proofSchema = z.object({
  proofPublicId: z.string().min(1, "Upload your proof of payment"),
  proofUrl: z.string().min(1),
  proofFormat: z.string().min(1),
  proofBytes: z.number().int().positive(),
  depositorName: z.string().trim().max(80).optional(),
  paidAt: z.string().optional(),
});

export const enrollSubmitSchema = z.object({
  form: registrationFormSchema,
  proof: proofSchema,
});

export type EnrollSubmitInput = z.input<typeof enrollSubmitSchema>;
