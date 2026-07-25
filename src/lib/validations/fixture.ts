import { z } from "zod";
import { MATCH_EVENT_TYPES } from "@/lib/constants";

export const fixtureSchema = z.object({
  competition: z.string().trim().min(2, "Name the competition, e.g. Friendly").max(80),
  ageGroup: z.string().trim().min(2, "Pick an age group"),
  teamId: z.string().min(1, "Pick our squad"),
  opponentId: z.string().min(1, "Pick the opponent"),
  isHome: z.boolean(),
  /** datetime-local value, interpreted as WAT (UTC+1, no DST) */
  kickoffAtLocal: z.string().min(1, "Set the kickoff date and time"),
  venue: z.string().trim().min(2, "Enter the venue").max(160),
  venueMapUrl: z.string().trim().url("Paste a full map link, or leave empty").optional().or(z.literal("")),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "POSTPONED", "CANCELLED"]),
  ticketNote: z.string().trim().max(200).optional().or(z.literal("")),
});

export type FixtureInput = z.input<typeof fixtureSchema>;

/** WAT is fixed UTC+1 — no DST anywhere in Nigeria. */
export function watLocalToUtc(local: string): Date {
  return new Date(`${local}:00+01:00`);
}

export function utcToWatLocal(date: Date): string {
  const shifted = new Date(date.getTime() + 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export const matchEventSchema = z.object({
  minute: z.coerce.number().int().min(0).max(130),
  type: z.enum(MATCH_EVENT_TYPES),
  playerId: z.string().optional().or(z.literal("")),
  playerNameFallback: z.string().trim().max(80).optional().or(z.literal("")),
});

export const resultSchema = z.object({
  fixtureId: z.string().min(1, "Pick the fixture"),
  goalsFor: z.coerce.number().int().min(0).max(99),
  goalsAgainst: z.coerce.number().int().min(0).max(99),
  halfTimeFor: z.coerce.number().int().min(0).max(99).optional().nullable(),
  halfTimeAgainst: z.coerce.number().int().min(0).max(99).optional().nullable(),
  matchReport: z.string().trim().max(8000).optional().or(z.literal("")),
  motmPlayerId: z.string().optional().or(z.literal("")),
  events: z.array(matchEventSchema).max(60),
});

export type ResultInput = z.input<typeof resultSchema>;
