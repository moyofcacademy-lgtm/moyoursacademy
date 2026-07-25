// Squads mirror the club's real team structure (Under-8/11/14/17).
export const AGE_GROUPS = [
  { key: "U8", label: "Ages 4–8", min: 4, max: 8 },
  { key: "U11", label: "Ages 9–11", min: 9, max: 11 },
  { key: "U14", label: "Ages 12–14", min: 12, max: 14 },
  { key: "U17", label: "Ages 15–18", min: 15, max: 18 },
] as const;

/** The academy's three training phases, as published by the club. */
export const PROGRAM_PHASES = [
  {
    key: "foundations",
    name: "Foundations",
    ages: "Ages 5–8",
    summary: "Building love for football through fun and structured play.",
  },
  {
    key: "development",
    name: "Development",
    ages: "Ages 9–13",
    summary: "Skill-building, tactical awareness, and teamwork.",
  },
  {
    key: "performance",
    name: "Performance",
    ages: "Ages 14–18",
    summary: "Advanced training, high-level competition, and exposure to scouts.",
  },
] as const;

export type AgeGroupKey = (typeof AGE_GROUPS)[number]["key"];

export const MIN_AGE = 4;
export const MAX_AGE = 18;

/** Age in whole years at a reference date. */
export function ageAt(dateOfBirth: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - dateOfBirth.getFullYear();
  const beforeBirthday =
    at.getMonth() < dateOfBirth.getMonth() ||
    (at.getMonth() === dateOfBirth.getMonth() && at.getDate() < dateOfBirth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function ageGroupForDob(dateOfBirth: Date, at: Date = new Date()): AgeGroupKey | null {
  const age = ageAt(dateOfBirth, at);
  const group = AGE_GROUPS.find((g) => age >= g.min && age <= g.max);
  return group?.key ?? null;
}

export const POSITIONS = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Winger",
  "Striker",
  "Not sure yet",
] as const;

export const REJECTION_REASONS = [
  { key: "PROOF_UNREADABLE", label: "Payment proof is unreadable" },
  { key: "AMOUNT_SHORT", label: "Amount paid is less than the required fee" },
  { key: "DUPLICATE", label: "Duplicate application" },
  { key: "OTHER", label: "Other" },
] as const;

export const PROOF_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const PROOF_FORMATS = ["jpg", "jpeg", "png", "pdf"] as const;

export const CLOUDINARY_FOLDERS = {
  proofs: "moyours/proofs",
  crests: "moyours/crests",
  gallery: "moyours/gallery",
  matches: "moyours/matches",
  players: "moyours/players",
  news: "moyours/news",
} as const;

export const MATCH_EVENT_TYPES = ["GOAL", "ASSIST", "YELLOW", "RED", "SUB"] as const;
