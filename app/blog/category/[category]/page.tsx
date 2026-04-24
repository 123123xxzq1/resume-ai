import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import {
  getAllCategories,
  getPostsByCategory,
} from "@/lib/blog";
import { SITE, absoluteUrl } from "@/lib/site";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

type Params = { category: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getAllCategories().map((c) => ({ category: c.name }));
}

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const category = decodeURIComponent(params.category);
  const posts = getPostsByCategory(category);
  if (posts.length === 0) return { title: "分类不存在" };
  const title = `${category} · 博客分类 · ${SITE.name}`;
  return {
    title,
    description: `${SITE.name} 博客「${category}」分类下的全部文章，共 ${posts.length} 篇。`,
    alternates: {
      canonical: absoluteUrl(`/blog/category/${encodeURIComponent(category)}`),
    },
  };
}

export default function CategoryPage({ params }: { params: Params }) {
  const category = decodeURIComponent(params.category);
  const posts = getPostsByCategory(category);
  if (posts.length === 0) notFound();

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              返回博客
            </Link>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              分类：{category}
            </h1>
            <p className="mt-2 text-slate-600">共 {posts.length} 篇文章</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
          {posts.map((p) => (
            <article key={p.slug} className="card group p-6 transition hover:shadow-md">
              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {p.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {p.readingMinutes} 分钟
                </span>
              </div>
              <h2 className="text-xl font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="mt-2 text-slate-600">{p.description}</p>
              <Link
                href={`/blog/${p.slug}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600"
              >
                阅读全文
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
