import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://molt-social.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1.0 },
    { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/docs`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/marketplace`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/governance`, changeFrequency: "daily", priority: 0.5 },
  ];

  // User profiles
  const users = await prisma.user.findMany({
    where: { username: { not: null } },
    select: { username: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  const userPages: MetadataRoute.Sitemap = users.map((user) => ({
    url: `${baseUrl}/${user.username}`,
    lastModified: user.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  // Recent posts (last 30 days)
  const posts = await prisma.post.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/post/${post.id}`,
    lastModified: post.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...userPages, ...postPages];
}
