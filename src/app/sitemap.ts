import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fixtures, results, posts, albums] = await Promise.all([
    prisma.fixture.findMany({
      where: { status: { in: ["SCHEDULED", "LIVE"] } },
      select: { id: true, updatedAt: true },
      take: 200,
    }),
    prisma.fixture.findMany({
      where: { status: "COMPLETED", result: { isNot: null } },
      select: { id: true, updatedAt: true },
      take: 200,
    }),
    prisma.post.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      take: 200,
    }),
    prisma.album.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      take: 200,
    }),
  ]);

  const statics: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/programs",
    "/squads",
    "/coaches",
    "/fixtures",
    "/results",
    "/gallery",
    "/news",
    "/support",
    "/contact",
    "/enroll",
  ].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "" || path === "/fixtures" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/enroll" ? 0.9 : 0.7,
  }));

  return [
    ...statics,
    ...fixtures.map((f) => ({
      url: `${site.url}/fixtures/${f.id}`,
      lastModified: f.updatedAt,
    })),
    ...results.map((f) => ({
      url: `${site.url}/results/${f.id}`,
      lastModified: f.updatedAt,
    })),
    ...posts.map((p) => ({
      url: `${site.url}/news/${p.slug}`,
      lastModified: p.updatedAt,
    })),
    ...albums.map((a) => ({
      url: `${site.url}/gallery/${a.slug}`,
      lastModified: a.updatedAt,
    })),
  ];
}
