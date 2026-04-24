export const SITE = {
  name: "ResumeAI",
  title: "ResumeAI — AI 简历优化器",
  description:
    "用 AI 30 秒把简历打磨到 HR 眼前一亮。ATS 匹配度评分、缺失关键词、STAR 式改写建议，一站式完成。",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://resume-ai-liart-six.vercel.app",
  author: "ResumeAI 团队",
  locale: "zh-CN",
  twitter: "@resumeai",
  ogImage: "/og-default.png",
};

export function absoluteUrl(path: string) {
  const base = SITE.url.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
