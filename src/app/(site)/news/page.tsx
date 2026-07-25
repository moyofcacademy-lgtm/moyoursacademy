import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateWAT } from "@/lib/utils";

export const metadata: Metadata = {
  title: "News",
  description: "Announcements and stories from Moyours Sports Academy.",
};

export const revalidate = 300;

export default async function NewsPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  return (
    <div className="mx-auto max-w-4xl px-[var(--gutter)] py-12">
      <h1 className="font-display text-step-3">News</h1>
      <p className="mt-3 max-w-2xl text-step-0 text-kit-soft">
        Announcements, match recaps, and academy stories.
      </p>

      {posts.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="No posts yet — the first announcement lands here soon." />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-5">
          {posts.map((post) => (
            <article key={post.id}>
              <Link
                href={`/news/${post.slug}`}
                className="group flex flex-col gap-4 rounded-brand border border-line bg-white/60 p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 sm:flex-row"
              >
                {post.coverUrl && (
                  <Image
                    src={
                      post.coverUrl.includes("res.cloudinary.com")
                        ? post.coverUrl.replace("/upload/", "/upload/f_auto,q_auto,w_400,h_260,c_fill/")
                        : post.coverUrl
                    }
                    alt=""
                    width={400}
                    height={260}
                    className="aspect-[3/2] w-full shrink-0 rounded-brand object-cover sm:w-48"
                  />
                )}
                <div className="min-w-0">
                  {post.publishedAt && (
                    <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
                      {formatDateWAT(post.publishedAt)}
                    </p>
                  )}
                  <h2 className="mt-1 font-display text-step-1 group-hover:underline">{post.title}</h2>
                  {post.excerpt && (
                    <p className="mt-2 text-step--1 leading-relaxed text-kit-soft">{post.excerpt}</p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
