import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "ResumeAI — 用 AI 30 秒把简历打磨到 HR 眼前一亮",
    template: `%s`,
  },
  description:
    "上传简历和岗位 JD，AI 立即输出 ATS 匹配度评分、缺失关键词、逐条 STAR 式改写建议。帮你在海投中脱颖而出。",
  keywords: [
    "简历优化",
    "AI 简历",
    "ATS 简历筛选",
    "简历关键词",
    "STAR 法则",
    "求职",
    "简历修改",
  ],
  authors: [{ name: SITE.author }],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    types: {
      "application/rss+xml": `${SITE.url}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "GDkYVUx2PCLHiWMv1A7Q_5l_oWNrTNCxmdcDvrAVLrw",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
