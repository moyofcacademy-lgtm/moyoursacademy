"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { destroyAsset } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils";

const postSchema = z.object({
  title: z.string().trim().min(3, "Give the post a title").max(140),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Write the post body"),
  coverUrl: z.string().optional().or(z.literal("")),
  coverPublicId: z.string().optional().or(z.literal("")),
  published: z.boolean(),
});

export type PostInput = z.input<typeof postSchema>;
export type NewsActionResult = { ok: true; id?: string } | { ok: false; error: string };

function revalidateNews(slug?: string) {
  revalidatePath("/news");
  revalidatePath("/");
  if (slug) revalidatePath(`/news/${slug}`);
}

export async function createPost(input: PostInput): Promise<NewsActionResult> {
  const actor = await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  let slug = slugify(data.title);
  if (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const post = await prisma.post.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      body: data.body,
      coverUrl: data.coverUrl || null,
      coverPublicId: data.coverPublicId || null,
      published: data.published,
      publishedAt: data.published ? new Date() : null,
    },
  });
  await audit({ actor, action: "post.created", entityType: "Post", entityId: post.id, metadata: { title: data.title } });
  revalidateNews(slug);
  return { ok: true, id: post.id };
}

export async function updatePost(id: string, input: PostInput): Promise<NewsActionResult> {
  const actor = await requireAdmin();
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "This post no longer exists." };

  await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      excerpt: data.excerpt || null,
      body: data.body,
      coverUrl: data.coverUrl || existing.coverUrl,
      coverPublicId: data.coverPublicId || existing.coverPublicId,
      published: data.published,
      publishedAt: data.published ? (existing.publishedAt ?? new Date()) : null,
    },
  });

  if (data.coverPublicId && existing.coverPublicId && data.coverPublicId !== existing.coverPublicId) {
    await destroyAsset(existing.coverPublicId);
  }

  await audit({ actor, action: "post.updated", entityType: "Post", entityId: id });
  revalidateNews(existing.slug);
  return { ok: true, id };
}

export async function deletePost(id: string): Promise<NewsActionResult> {
  const actor = await requireAdmin();
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return { ok: true };
  await prisma.post.delete({ where: { id } });
  if (post.coverPublicId) await destroyAsset(post.coverPublicId);
  await audit({ actor, action: "post.deleted", entityType: "Post", entityId: id, metadata: { title: post.title } });
  revalidateNews(post.slug);
  return { ok: true };
}
