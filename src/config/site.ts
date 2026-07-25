export const site = {
  name: "Moyours Sports Academy",
  shortName: "Moyours",
  tagline: "More than an academy — a family.",
  description:
    "Moyours Sports Academy is a youth football academy in Abuja, Nigeria, offering structured training for boys and girls aged 4–18 — skill development, teamwork, character building, and exposure to opportunities.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  address: "Suite A05, Tsukunda House, Central Business District, Abuja",
  city: "Abuja",
  country: "Nigeria",
  phones: ["08099926480", "08034955885", "08099931151"],
  email: "admin@moyoursacademy.ng",
  mapsQuery: "Tsukunda House, Central Business District, Abuja",
} as const;
