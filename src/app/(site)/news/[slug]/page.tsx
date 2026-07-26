import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn, formatDateWAT } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return { title: "News" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: post.coverUrl ? { images: [{ url: post.coverUrl }] } : undefined,
  };
}

export const revalidate = 300;

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();

  return (
    <article className="mx-auto max-w-2xl px-[var(--gutter)] py-12">
      <Link href="/news" className="text-step--1 font-semibold text-kit-soft underline-offset-4 hover:underline">
        ← All news
      </Link>
      {post.publishedAt && (
        <p className="mt-6 font-mono text-[0.6875rem] uppercase tracking-widest text-kit-soft">
          {formatDateWAT(post.publishedAt)}
        </p>
      )}
      <h1 className="mt-2 font-display text-step-3">{post.title}</h1>
      {post.coverUrl && (
        <Image
          src={
            post.coverUrl.includes("res.cloudinary.com")
              ? post.coverUrl.replace("/upload/", "/upload/f_auto,q_auto,w_1200/")
              : post.coverUrl
          }
          alt=""
          width={1200}
          height={675}
          priority
          className="mt-6 w-full rounded-brand border border-line object-contain"
        />
      )}
      <div className="rule-gold mt-8 bg-white/60 p-6">
        {post.body.split(/\n{2,}/).map((paragraph, i) => (
          <p key={i} className={cn("text-step-0 leading-relaxed", i > 0 && "mt-4")}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
