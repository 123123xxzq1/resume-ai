import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen } from "lucide-react";
import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog";
import { SITE, absoluteUrl } from "@/lib/site";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import BlogSearch from "@/components/BlogSearch";

export const metadata: Metadata = {
  title: `博客 · ${SITE.name} — 简历优化 / ATS / 求职干货`,
  description:
    "ResumeAI 官方博客：ATS 筛选机制、简历关键词清单、STAR 法则改写、求职面试干货，帮你拿到更好的 offer。",
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: `博客 · ${SITE.name}`,
    description:
      "ATS 筛选机制、简历关键词清单、STAR 法则改写、求职面试干货。",
    url: absoluteUrl("/blog"),
    type: "website",
    siteName: SITE.name,
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="flex items-center gap-2 text-sm text-brand-600">
              <BookOpen className="h-4 w-4" />
              <span>ResumeAI 博客</span>
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              让每一次投递
              <span className="bg-gradient-to-r from-brand-600 to-purple-500 bg-clip-text text-transparent">
                {" "}都更接近 offer
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              从 ATS 规则到 JD 关键词，从 STAR 法则到面试话术。我们把招聘行业的隐藏规则都写在这里。
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
            {/* Posts with search */}
            <BlogSearch posts={posts} categories={categories} />

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="card p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">分类</h3>
                <ul className="space-y-2">
                  {categories.map((c) => (
                    <li key={c.name}>
                      <Link
                        href={`/blog/category/${encodeURIComponent(c.name)}`}
                        className="flex items-center justify-between text-sm text-slate-600 hover:text-brand-700"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-slate-400">{c.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">热门标签</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Link
                      key={t.name}
                      href={`/blog/tag/${encodeURIComponent(t.name)}`}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                    >
                      {t.name} · {t.count}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card overflow-hidden bg-gradient-to-br from-brand-600 to-purple-600 p-6 text-white">
                <h3 className="text-lg font-semibold">先测一下你的简历？</h3>
                <p className="mt-2 text-sm text-white/80">
                  粘贴简历和 JD，30 秒看到 ATS 匹配度评分。前 3 次免费。
                </p>
                <Link
                  href="/analyze"
                  className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-slate-100"
                >
                  开始分析
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
