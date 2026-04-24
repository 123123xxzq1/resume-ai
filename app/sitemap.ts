import type { MetadataRoute } from "next";
import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog";
import { SITE, absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: absoluteUrl("/analyze"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.updated || p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/blog/category/${encodeURIComponent(c.name)}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: absoluteUrl(`/blog/tag/${encodeURIComponent(t.name)}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  // 避免 SITE 未使用警告
  void SITE;

  return [...staticEntries, ...postEntries, ...categoryEntries, ...tagEntries];
}
