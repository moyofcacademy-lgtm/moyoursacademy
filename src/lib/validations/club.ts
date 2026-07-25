import { z } from "zod";

export const clubSchema = z.object({
  name: z.string().trim().min(2, "Enter the club's name").max(80),
  shortName: z
    .string()
    .trim()
    .max(4, "Short name is 2–4 letters, e.g. GAR")
    .transform((v) => v.toUpperCase())
    .optional()
    .or(z.literal("")),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  logoPublicId: z.string().optional().or(z.literal("")),
});

export type ClubInput = z.input<typeof clubSchema>;
