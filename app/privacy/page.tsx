import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "隐私政策 · ResumeAI",
  description:
    "ResumeAI 隐私政策：我们如何处理你的简历数据、登录信息、支付信息。你有哪些权利。",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-white">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <header className="mb-10 border-b border-slate-200 pb-6">
            <h1 className="text-4xl font-bold text-slate-900">隐私政策</h1>
            <p className="mt-3 text-sm text-slate-500">
              最近更新：2025 年 4 月 · 我们尽力把这份文档写得像人说话一样。
            </p>
          </header>

          <div className="prose-custom">
            <h2>一句话版</h2>
            <p>
              <strong>
                你的简历内容，仅在你发起分析请求时短暂停留于服务器内存，**完成后立即销毁**，不写入任何数据库。
              </strong>
              我们只在你注册登录时保存最基本的账户标识（邮箱 + 订阅状态）。
            </p>

            <h2>我们收集什么信息</h2>
            <h3>1. 简历与 JD 内容（分析时传输）</h3>
            <p>
              当你点击"开始分析"时，你提交的简历文本与 JD 会通过 HTTPS
              传输到我们服务器，经 OpenAI API 处理后返回结果。
              <strong>我们不会把原始简历内容写入数据库</strong>。服务端仅保留两份"预览快照"：
            </p>
            <ul>
              <li>
                简历前 200 字符摘要（用于在你的 Dashboard 里帮你回忆"这次是分析哪份简历"）
              </li>
              <li>
                JD 前 200 字符摘要（同上）
              </li>
            </ul>
            <p>
              未登录的游客用户，完全不保存任何预览摘要。
            </p>

            <h3>2. 账户信息（登录后）</h3>
            <p>
              如果你注册账户（可选），我们会保存：
            </p>
            <ul>
              <li>登录邮箱（用于验证、通知、退款联系）</li>
              <li>订阅状态（免费 / Pro / 终身）、剩余额度、到期时间</li>
              <li>分析历史的摘要快照（见上方"预览"）与评分</li>
            </ul>
            <p>
              <strong>我们不会保存</strong>：你的微信号、手机号、身份证、个人简历原文、JD 原文。
            </p>

            <h3>3. 支付信息</h3>
            <p>
              支付由 <strong>Stripe（海外）</strong> 或 <strong>易支付（微信/支付宝）</strong>
              处理，信用卡 / 支付账号敏感信息
              <strong>从未经过我们的服务器</strong>。我们仅从支付方接收一个订单 ID、金额、状态
              用于激活你的会员。
            </p>

            <h3>4. Cookie 与本地存储</h3>
            <p>我们使用两种 Cookie：</p>
            <ul>
              <li>
                <strong>登录态 Cookie</strong>（Supabase Auth）—
                仅在你登录后设置，HttpOnly，SameSite=Lax。
              </li>
              <li>
                <strong>游客额度 Cookie</strong>（demo_uses）—
                如果你未登录使用免费体验，我们在你的浏览器存一个小 JSON，记录今日用了几次。
                仅用于防止匿名滥用，不关联任何身份。
              </li>
            </ul>
            <p>
              我们<strong>不使用任何第三方追踪 Cookie</strong>（Google Analytics、广告、画像 SDK 都没有）。
            </p>

            <h2>数据传输到哪些第三方</h2>
            <ul>
              <li>
                <strong>OpenAI</strong> — 执行 AI 分析时，你的简历和 JD 文本会传给 OpenAI API
                （接受 OpenAI 数据使用条款，默认不用于模型训练）。
              </li>
              <li>
                <strong>Supabase</strong> — 账户与订阅数据存储（账户邮箱、积分、历史摘要）。
              </li>
              <li>
                <strong>Stripe / 易支付</strong> — 仅处理支付。
              </li>
              <li>
                <strong>Vercel</strong> — 站点托管。Vercel 可能记录访问日志（IP、UserAgent），
                保留期 ≤30 天。
              </li>
            </ul>

            <h2>你有的权利</h2>
            <ul>
              <li>
                <strong>访问</strong>：登录后在 Dashboard 查看所有历史记录。
              </li>
              <li>
                <strong>删除</strong>：发送邮件到 hi@resumeai.com 要求删除账户及所有关联数据，
                我们会在 7 个工作日内完成。
              </li>
              <li>
                <strong>导出</strong>：可以向客服申请一份你账户数据的 JSON 导出。
              </li>
              <li>
                <strong>退订邮件</strong>：点击邮件底部 "退订" 链接即可。
              </li>
            </ul>

            <h2>数据安全</h2>
            <ul>
              <li>全站 HTTPS（由 Vercel / 托管方提供）</li>
              <li>数据库访问仅通过 Supabase RLS（Row Level Security）策略</li>
              <li>Service Role Key 仅用于服务端 webhook，永不暴露给前端</li>
              <li>定期依赖安全扫描（Dependabot / Snyk）</li>
            </ul>

            <h2>儿童隐私</h2>
            <p>
              ResumeAI 不面向 14 岁以下用户。如果你认为一名儿童向我们提交了个人信息，
              请联系我们，我们会尽快删除。
            </p>

            <h2>政策更新</h2>
            <p>
              我们可能会更新这份政策。任何重大变更（新增的第三方数据接收者、扩大收集范围），
              我们会在更新 30 天前以邮件或站内 banner 通知你。
            </p>

            <h2>联系我们</h2>
            <p>
              有任何隐私问题，请邮件：<strong>hi@resumeai.com</strong>，
              48 小时内回复。
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
