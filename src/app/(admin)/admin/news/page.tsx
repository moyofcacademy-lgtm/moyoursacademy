import { prisma } from "@/lib/prisma";
import { NewsManager } from "./news-manager";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="font-display text-step-2">News</h1>
      <NewsManager
        posts={posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? "",
          body: post.body,
          coverUrl: post.coverUrl,
          published: post.published,
          publishedAtIso: post.publishedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
