import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Calendar,
  Clock,
  Tag as TagIcon,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ListTree,
  RefreshCw,
} from "lucide-react";
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog";
import { SITE, absoluteUrl } from "@/lib/site";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "文章未找到" };
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: `${post.title} · ${SITE.name}`,
    description: post.description,
    alternates: { canonical: url },
    authors: [{ name: post.author }],
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      siteName: SITE.name,
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(post, 3);
  const url = absoluteUrl(`/blog/${post.slug}`);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    datePublished: post.date,
    dateModified: post.updated || post.date,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    inLanguage: SITE.locale,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首页", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "博客", item: absoluteUrl("/blog") },
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: absoluteUrl(`/blog/category/${encodeURIComponent(post.category)}`),
      },
      { "@type": "ListItem", position: 4, name: post.title, item: url },
    ],
  };

  return (
    <>
      <SiteNav />
      <main className="bg-slate-50">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        {/* Breadcrumb */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-3 text-sm text-slate-500">
            <Link href="/" className="hover:text-slate-900">首页</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link href="/blog" className="hover:text-slate-900">博客</Link>
            <span className="mx-2 text-slate-300">/</span>
            <Link
              href={`/blog/category/${encodeURIComponent(post.category)}`}
              className="hover:text-slate-900"
            >
              {post.category}
            </Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-700 line-clamp-1">{post.title}</span>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
            <article className="min-w-0">
              {/* Header */}
              <header className="mb-8">
                <Link
                  href={`/blog/category/${encodeURIComponent(post.category)}`}
                  className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  {post.category}
                </Link>
                <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
                  {post.title}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  {post.description}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    发布：{post.date}
                  </span>
                  {post.updated && post.updated !== post.date && (
                    <span className="inline-flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      更新：{post.updated}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    约 {post.readingMinutes} 分钟
                  </span>
                  <span>· 作者：{post.author}</span>
                </div>
              </header>

              {/* Body */}
              <div
                className="prose-custom"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6">
                  <span className="text-sm text-slate-500">标签：</span>
                  {post.tags.map((t) => (
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
              )}

              {/* Inline CTA */}
              <aside className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 p-8 text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs">
                      <Sparkles className="h-3 w-3" />
                      免费工具
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold">
                      把这篇文章的方法用到你自己的简历上
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      粘贴简历 + JD，AI 30 秒输出匹配度评分 + 缺失关键词 + STAR 改写建议。
                    </p>
                  </div>
                  <Link
                    href="/analyze"
                    className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-brand-700 hover:bg-slate-100"
                  >
                    免费开始
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>

              {/* Related */}
              {related.length > 0 && (
                <section className="mt-12">
                  <h2 className="mb-5 text-xl font-semibold">继续阅读</h2>
                  <div className="grid gap-4 md:grid-cols-3">
                    {related.map((r) => (
                      <Link
                        key={r.slug}
                        href={`/blog/${r.slug}`}
                        className="card group p-5 transition hover:shadow-md"
                      >
                        <div className="mb-2 text-xs text-brand-600">
                          {r.category}
                        </div>
                        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
                          {r.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {r.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Back */}
              <div className="mt-12 border-t border-slate-200 pt-6">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  回到博客首页
                </Link>
              </div>
            </article>

            {/* TOC */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              {post.toc.length > 0 && (
                <div className="card p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ListTree className="h-4 w-4 text-brand-600" />
                    目录
                  </div>
                  <nav className="space-y-1.5 text-sm">
                    {post.toc.map((h) => (
                      <a
                        key={h.id + h.text}
                        href={`#${h.id}`}
                        className={`block leading-snug text-slate-600 hover:text-brand-700 ${
                          h.level === 3 ? "pl-3 text-xs text-slate-500" : ""
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
