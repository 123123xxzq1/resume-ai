import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Target,
  FileText,
  Zap,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Clock,
} from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getAllPosts } from "@/lib/blog";

export default function Home() {
  const featuredPosts = getAllPosts().slice(0, 6);
  return (
    <main className="min-h-screen">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-x-0 top-0 h-[500px] glow" />
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600"></span>
            </span>
            GPT-4o 驱动 · 2025 新上线 · 内测体验中
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            让你的简历在
            <span className="bg-gradient-to-r from-brand-600 to-purple-500 bg-clip-text text-transparent">
              {" "}7 秒 ATS 筛选{" "}
            </span>
            中活下来
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            粘贴简历 + 目标岗位 JD，AI 30 秒给你：匹配度评分、缺失关键词、逐条 STAR 改写建议。
            不再猜 HR 想要什么。
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/analyze" className="btn-primary px-6 py-3 text-base">
              免费分析我的简历
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#pricing" className="btn-secondary px-6 py-3 text-base">
              查看定价
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-500">3 次免费 · 无需注册 · 数据不保存</p>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600" />
              <span>GPT-4o 技术驱动</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-600" />
              <span>13 篇深度求职指南</span>
            </div>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <span>浏览器本地处理 · 不上传不保存</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">为什么 ResumeAI 有效</h2>
          <p className="mt-4 text-slate-600">
            我们不做表面修辞，针对 ATS（申请跟踪系统）的真实打分规则优化
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: "ATS 匹配度评分",
              desc: "基于 JD 抓取关键词、技能、经验要求，给出 0-100 的匹配度，告诉你 HR 系统会给你打多少分。",
            },
            {
              icon: Zap,
              title: "逐条 STAR 改写",
              desc: "针对每一条工作经历，AI 用 Situation-Task-Action-Result 框架重写，强化动词、量化结果。",
            },
            {
              icon: FileText,
              title: "缺失关键词提醒",
              desc: "列出 JD 里但你简历没有的硬技能、软技能、证书、工具，告诉你该在哪里补。",
            },
            {
              icon: Sparkles,
              title: "中英双语支持",
              desc: "国内大厂、外企、海外岗一套解决方案。输入任一语言，AI 自动识别并输出对应建议。",
            },
            {
              icon: ShieldCheck,
              title: "隐私优先",
              desc: "不注册、不存储。分析完即焚，只在你浏览器本地记录试用次数，保护你的职业隐私。",
            },
            {
              icon: CheckCircle2,
              title: "可落地的 Action List",
              desc: "不只是建议，更有 Before / After 对比示例，复制即用，10 分钟内完成全简历优化。",
            },
          ].map((f, i) => (
            <div key={i} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Matrix */}
      <section id="resources" className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <BookOpen className="h-3 w-3" />
                求职知识库
              </div>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                13 篇深度求职指南，全部免费
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                从简历 STAR 改写、ATS 规则、大厂模板，到面试话术、薪资谈判——
                我们把真实求职场景拆到每一个细节。
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              查看全部 13 篇
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group card flex flex-col p-6 transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="h-3 w-3" />
                    {post.readingMinutes} 分钟
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {post.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-700">
                  阅读全文
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">简单透明的定价</h2>
            <p className="mt-4 text-slate-600">按需付费，没有隐藏费用</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "免费试用",
                price: "¥0",
                unit: "/ 3 次",
                highlight: false,
                features: [
                  "3 次完整分析",
                  "ATS 匹配度评分",
                  "关键词缺失提醒",
                  "基础改写建议",
                ],
                cta: "立即试用",
              },
              {
                name: "Pro 月度",
                price: "¥9.9",
                unit: "/ 月",
                highlight: true,
                features: [
                  "无限次分析",
                  "STAR 式深度改写",
                  "多份简历管理",
                  "求职信一键生成",
                  "中英双语导出",
                  "邮件优先支持",
                ],
                cta: "升级会员",
              },
              {
                name: "Pro 年度",
                price: "¥96",
                unit: "/ 年",
                highlight: false,
                features: [
                  "365 天无限次使用",
                  "会员全部功能",
                  "按月仅 ¥8，省 19%",
                  "优先客服支持",
                ],
                cta: "买年卡更划算",
              },
            ].map((p, i) => (
              <div
                key={i}
                className={`card relative p-8 ${
                  p.highlight
                    ? "border-brand-500 shadow-lg ring-2 ring-brand-500"
                    : ""
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white">
                    最受欢迎
                  </div>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.unit}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((fe, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                      <span className="text-slate-700">{fe}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/analyze"
                  className={`mt-8 block w-full rounded-lg px-5 py-2.5 text-center text-sm font-medium transition ${
                    p.highlight
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">常见问题</h2>
        <div className="mt-10 space-y-4">
          {[
            {
              q: "我的简历会被保存吗？",
              a: "不会。MVP 版本完全在请求生命周期内处理，不写入任何数据库。你可以放心上传包含敏感信息的简历。",
            },
            {
              q: "准确度如何？",
              a: "我们使用 GPT-4o-mini，并针对 ATS 规则编写了定制化提示词。实测可以识别 JD 中 90% 以上的关键技能和隐含要求。",
            },
            {
              q: "支持哪些格式？",
              a: "目前支持 PDF 上传、纯文本粘贴。Word (docx) 请另存为 PDF 后上传，或直接复制粘贴内容。",
            },
            {
              q: "免费版和 Pro 的区别？",
              a: "免费版可以完整体验核心分析流程（ATS 评分、关键词缺口、改写建议），每日 3 次限额足够一次求职周期使用。Pro 提供无限次分析、多份简历管理、求职信一键生成等进阶能力，适合高频投递的求职者。",
            },
          ].map((item, i) => (
            <details key={i} className="card group p-5">
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                {item.q}
                <span className="text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-brand-600 to-purple-600 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">别让一份差简历毁掉心仪 offer</h2>
          <p className="mt-4 text-white/80">3 次免费分析，30 秒看到结果</p>
          <Link
            href="/analyze"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 shadow-sm hover:bg-slate-100"
          >
            现在开始
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
