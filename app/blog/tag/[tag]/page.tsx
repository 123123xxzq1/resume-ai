import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag as TagIcon } from "lucide-react";
import { getAllTags, getPostsByTag } from "@/lib/blog";
import { SITE, absoluteUrl } from "@/lib/site";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

type Params = { tag: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getAllTags().map((t) => ({ tag: t.name }));
}

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(tag);
  if (posts.length === 0) return { title: "标签不存在" };
  return {
    title: `#${tag} · 标签 · ${SITE.name}`,
    description: `${SITE.name} 博客「${tag}」标签下的全部文章，共 ${posts.length} 篇。`,
    alternates: {
      canonical: absoluteUrl(`/blog/tag/${encodeURIComponent(tag)}`),
    },
  };
}

export default function TagPage({ params }: { params: Params }) {
  const tag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(tag);
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
            <h1 className="mt-3 inline-flex items-center gap-2 text-4xl font-bold tracking-tight">
              <TagIcon className="h-7 w-7 text-brand-600" />
              {tag}
            </h1>
            <p className="mt-2 text-slate-600">共 {posts.length} 篇文章</p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
          {posts.map((p) => (
            <article key={p.slug} className="card group p-6 transition hover:shadow-md">
              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <Link
                  href={`/blog/category/${encodeURIComponent(p.category)}`}
                  className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700"
                >
                  {p.category}
                </Link>
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
