/**
 * The academy's real coaching staff, names and titles as published on
 * moyoursacademy.ng. Bios are starter copy. Edit photos and bios in
 * Admin → Coaches. ageGroup maps each coach's cohort to the squad whose
 * age band contains it (used for the squad-coach chip on /squads).
 */
export const REAL_COACHES = [
  {
    name: "Coach Olumuyiwa",
    role: "Head Coach",
    ageGroup: null,
    bio: "Founder and head coach. Moyours began when Coach Olumuyiwa helped a student struggling to make his school team. Nine years later, that gesture has grown into a FIFA and NFF registered academy developing players who compete at local and global levels.",
    badges: [],
  },
  {
    name: "Coach Emmanuel Micheal",
    role: "Assistant Head Coach",
    ageGroup: null,
    bio: "Works alongside the head coach across every phase of the pathway, from Foundations sessions to Performance-phase match preparation.",
    badges: [],
  },
  {
    name: "Coach Ani Patrick",
    role: "Under-15 Coach",
    ageGroup: "U17",
    bio: "Leads the older development cohort — tactical understanding, competitive standards, and preparing players for trials and scouts.",
    badges: [],
  },
  {
    name: "Coach Owoade Segun",
    role: "Under-15 Assistant Coach",
    ageGroup: null,
    bio: "Supports the Under-15 group with individual technical work and matchday organisation.",
    badges: [],
  },
  {
    name: "Coach Akinsanya David",
    role: "Under-12 Coach",
    ageGroup: "U14",
    bio: "Coaches the skill-building years: control, passing, dribbling, and tactical awareness introduced through small-sided games.",
    badges: [],
  },
  {
    name: "Coach Chukwuemeka Paul",
    role: "Under-10 Coach",
    ageGroup: "U11",
    bio: "Builds core technique and teamwork with the 9–11 cohort — every session ends with the game the players came for.",
    badges: [],
  },
  {
    name: "Coach Abi Peter",
    role: "Under-8 Coach",
    ageGroup: "U8",
    bio: "Runs the Foundations phase, building love for football through fun and structured play.",
    badges: [],
  },
] as const;
