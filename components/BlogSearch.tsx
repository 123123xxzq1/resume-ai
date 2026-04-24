"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Tag as TagIcon,
  ArrowRight,
  Search,
  X,
} from "lucide-react";

type PostItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  readingMinutes: number;
};

export default function BlogSearch({
  posts,
  categories,
}: {
  posts: PostItem[];
  categories: { name: string; count: number }[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("全部");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      const catOk = cat === "全部" || p.category === cat;
      if (!catOk) return false;
      if (!needle) return true;
      const hay =
        p.title.toLowerCase() +
        " " +
        p.description.toLowerCase() +
        " " +
        p.tags.join(" ").toLowerCase() +
        " " +
        p.category.toLowerCase();
      return hay.includes(needle);
    });
  }, [posts, q, cat]);

  return (
    <div>
      {/* Filter bar */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索文章标题、描述、标签..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 py-2 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100"
              aria-label="清除搜索"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ name: "全部", count: posts.length }, ...categories].map((c) => (
            <button
              key={c.name}
              onClick={() => setCat(c.name)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                cat === c.name
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
              <span className="ml-1 opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-slate-500">
            没有匹配的文章，换个关键词试试。
          </div>
        )}
        {filtered.map((p) => (
          <article
            key={p.slug}
            className="card group p-6 transition hover:shadow-md"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Link
                href={`/blog/category/${encodeURIComponent(p.category)}`}
                className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700 hover:bg-brand-100"
              >
                {p.category}
              </Link>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {p.date}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {p.readingMinutes} 分钟阅读
              </span>
            </div>
            <h2 className="text-2xl font-semibold leading-snug text-slate-900">
              <Link
                href={`/blog/${p.slug}`}
                className="transition hover:text-brand-700"
              >
                {highlight(p.title, q)}
              </Link>
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              {highlight(p.description, q)}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {p.tags.slice(0, 4).map((t) => (
                  <Link
                    key={t}
                    href={`/blog/tag/${encodeURIComponent(t)}`}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                  >
                    <TagIcon className="h-3 w-3" />
                    {t}
                  </Link>
                ))}
              </div>
              <Link
                href={`/blog/${p.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                阅读全文
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function highlight(text: string, q: string) {
  const needle = q.trim();
  if (!needle) return text;
  try {
    const re = new RegExp(
      `(${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "ig"
    );
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <mark
          key={i}
          className="rounded bg-amber-100 px-0.5 text-amber-900"
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  } catch {
    return text;
  }
}
