const fallbackSiteUrl = "http://localhost:3000";

function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return fallbackSiteUrl;

  try {
    return new URL(value).origin;
  } catch {
    console.warn("NEXT_PUBLIC_SITE_URL is invalid; using the local fallback URL.");
    return fallbackSiteUrl;
  }
}

export const site = {
  name: "Moyours Football Club Academy",
  shortName: "Moyours",
  tagline: "Raising Champions",
  vision: "A society healed by sports",
  heroTagline:
    "We believe football is more than a game. It's a path to growth, opportunity, and transformation.",
  description:
    "Moyours Football Club Academy is a FIFA- and NFF-registered youth football academy in Abuja, Nigeria — over 9 years training and mentoring boys and girls aged 4–18, bridging grassroots football with international career opportunities.",
  url: getSiteUrl(),
  address: "Suite A05, Tsukunda House, Central Business District, Abuja",
  city: "Abuja",
  country: "Nigeria",
  phones: ["08099926480", "08034955885", "08099931151"],
  email: "admin@moyoursacademy.com",
  supportEmail: "admin@moyoursfcacademy.com",
  mapsQuery: "Tsukunda House, Central Business District, Abuja",
  credentials: [
    { label: "FIFA ID", value: "14DHVUF", logo: "/badges/fifa.png" },
    { label: "NFF Member ID", value: "0733C", logo: "/badges/nff.png" },
    { label: "Club ID", value: "184592", logo: "/crest.png" },
  ],
  sponsors: [
    { name: "DYNASPRO", logo: "/sponsors/dynaspro.png" },
    { name: "FCV International Football Academy", logo: "/sponsors/fcv.png" },
    { name: "NIMASA", logo: "/sponsors/nimasa.png" },
    { name: "Noneldan Travels", logo: "/sponsors/noneldan.png" },
  ],
  stats: [
    { value: "9+", label: "Years of consistent operations in Abuja" },
    { value: "65", label: "Players registered — 35 on full scholarships" },
    { value: "2", label: "Training locations established to meet growing demand" },
    { value: "83%", label: "Win/draw record in the 2024–2025 season" },
  ],
  services: [
    {
      name: "Specialized Home Training",
      description:
        "Our expert coaches will come to you, providing individualized coaching that targets specific areas for improvement.",
    },
    {
      name: "Sports Mentorship",
      description:
        "Our mentorship program pairs young athletes with experienced mentors who provide guidance, support, and advice on navigating the world of sports.",
    },
    {
      name: "Summer Camps",
      description:
        "Rigorous training combined with fun activities, fostering both athletic and personal development.",
    },
    {
      name: "International Transfers",
      description:
        "Our network and expertise in handling international transfers help players take their careers to the global stage.",
    },
    {
      name: "Sports Events Management",
      description:
        "From tournaments to community festivals, we plan and deliver football events end to end.",
    },
  ],
} as const;
