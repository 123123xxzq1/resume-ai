import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;            // ISO yyyy-mm-dd
  updated?: string;
  category: string;
  tags: string[];
  author: string;
  cover?: string;
  readingMinutes: number;
};

export type Post = PostMeta & {
  html: string;
  toc: { id: string; text: string; level: number }[];
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function readAll(): { file: string; raw: string }[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => ({
      file: f,
      raw: fs.readFileSync(path.join(POSTS_DIR, f), "utf-8"),
    }));
}

function toMeta(file: string, raw: string): PostMeta {
  const { data, content } = matter(raw);
  const slug = (data.slug as string) || file.replace(/\.(md|mdx)$/, "");
  const stats = readingTime(content);
  return {
    slug,
    title: String(data.title || slug),
    description: String(data.description || ""),
    date: String(data.date || new Date().toISOString().slice(0, 10)),
    updated: data.updated ? String(data.updated) : undefined,
    category: String(data.category || "职场干货"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: String(data.author || "ResumeAI 团队"),
    cover: data.cover ? String(data.cover) : undefined,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

export function getAllPosts(): PostMeta[] {
  return readAll()
    .map(({ file, raw }) => toMeta(file, raw))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllCategories(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of getAllPosts()) {
    map.set(p.category, (map.get(p.category) || 0) + 1);
  }
  return Array.from(map, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );
}

export function getAllTags(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of getAllPosts()) {
    for (const t of p.tags) map.set(t, (map.get(t) || 0) + 1);
  }
  return Array.from(map, ([name, count]) => ({ name, count })).sort(
    (a, b) => b.count - a.count
  );
}

export function getPostsByCategory(category: string): PostMeta[] {
  return getAllPosts().filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
}

export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const files = readAll();
  const hit = files.find(
    ({ file, raw }) =>
      file.replace(/\.(md|mdx)$/, "") === slug ||
      (matter(raw).data?.slug as string) === slug
  );
  if (!hit) return null;

  const { data, content } = matter(hit.raw);
  const meta = toMeta(hit.file, hit.raw);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: "heading-anchor" },
    })
    .use(rehypeStringify)
    .process(content);

  const html = String(file);
  const toc = extractToc(content);

  return { ...meta, html, toc };
}

export function getRelatedPosts(current: PostMeta, limit = 3): PostMeta[] {
  const all = getAllPosts().filter((p) => p.slug !== current.slug);
  const scored = all.map((p) => {
    let score = 0;
    if (p.category === current.category) score += 3;
    for (const t of p.tags) if (current.tags.includes(t)) score += 1;
    return { p, score };
  });
  return scored
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, limit)
    .map((x) => x.p);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\u3000]+/g, "-")
    .replace(/[^\w\-\u4e00-\u9fa5]/g, "")
    .replace(/-+/g, "-");
}

function extractToc(
  markdown: string
): { id: string; text: string; level: number }[] {
  const lines = markdown.split("\n");
  const toc: { id: string; text: string; level: number }[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2].replace(/[#*`]/g, "").trim();
      toc.push({ id: slugify(text), text, level });
    }
  }
  return toc;
}
