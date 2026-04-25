import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import PricingCard from "./PricingCard";
import { PLANS } from "@/lib/payments/plans";
import { getCurrentUser } from "@/lib/supabase/server";
import { stripeProvider } from "@/lib/payments/stripe";
import { afdianProvider } from "@/lib/payments/afdian";
import { zpayProvider } from "@/lib/payments/zpay";
import {
  Gift,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Clock3,
  RefreshCw,
} from "lucide-react";

export const metadata: Metadata = {
  title: "定价 · ResumeAI",
  description:
    "ResumeAI 订阅方案：免费版每日 3 次、Pro 月度 ¥9.9 无限次、Pro 年度 ¥96。支持微信 / 支付宝 赞助解锁，7 天无理由退款。",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: { canceled?: string };
}) {
  let isLoggedIn = false;
  try {
    const user = await getCurrentUser();
    isLoggedIn = !!user;
  } catch {
    isLoggedIn = false;
  }

  const stripeEnabled = stripeProvider.isConfigured();
  const zpayEnabled = zpayProvider.isConfigured();
  const afdianEnabled = afdianProvider.isConfigured();
  const paymentReady = stripeEnabled || zpayEnabled || afdianEnabled;

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 pt-20 pb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
              <Sparkles className="h-3 w-3 text-brand-600" />
              按投递 1 份简历的成本算，都回本了
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              找到工作的成本，
              <br className="sm:hidden" />
              应该比一杯咖啡便宜
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              免费版每日 <strong className="text-slate-900">3 次</strong> 完整分析，够一个求职周期用。
              <br className="hidden sm:block" />
              不满意 <strong className="text-slate-900">7 天无理由退款</strong>，没有任何心理负担。
            </p>

            {searchParams.canceled === "1" && (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm text-amber-700">
                <span>⚠️ 支付已取消，你可以随时再来</span>
              </div>
            )}
          </div>
        </section>

        {/* 3-Card Grid */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Free Card */}
            <div className="card flex flex-col p-8">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-slate-900">免费版</h3>
                <p className="mt-1 text-sm text-slate-500">
                  先试用，满意再付费
                </p>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">¥0</span>
                  <span className="text-sm text-slate-500"> · 永久免费</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  无需信用卡 · 不绑定任何身份
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-2.5 text-sm">
                {[
                  "每日 3 次完整分析",
                  "ATS 匹配度评分",
                  "缺失关键词对照",
                  "基础改写建议",
                  "13 篇深度求职指南",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    <span>{f}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-slate-400">
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="line-through">STAR 深度改写</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="line-through">多简历管理</span>
                </li>
              </ul>

              <Link
                href="/analyze"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                立即免费体验
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Pro Card */}
            <PricingCard
              plan={PLANS.pro_monthly}
              isLoggedIn={isLoggedIn}
              stripeEnabled={stripeEnabled}
              zpayEnabled={zpayEnabled}
              afdianEnabled={afdianEnabled}
            />

            {/* Pro Yearly Card */}
            <PricingCard
              plan={PLANS.pro_yearly}
              isLoggedIn={isLoggedIn}
              stripeEnabled={stripeEnabled}
              zpayEnabled={zpayEnabled}
              afdianEnabled={afdianEnabled}
            />
          </div>

          {/* Payment pending banner — friendly version */}
          {!paymentReady && (
            <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div>
                  <span className="font-semibold">支付通道内测中</span>
                  <span className="ml-2 text-blue-800">
                    微信 / 支付宝 / 海外信用卡 正在接入最后审核，预计 1-2 周开放。
                  </span>
                  <div className="mt-2">
                    <span>想第一时间试 Pro？</span>{" "}
                    <Link
                      href="/analyze"
                      className="font-medium underline underline-offset-2 hover:text-blue-700"
                    >
                      先用免费版每日 3 次 →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Comparison Table */}
        <section className="border-y border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold">完整功能对比</h2>
            <p className="mt-3 text-center text-sm text-slate-600">
              一眼看清不同版本的能力边界
            </p>

            <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-slate-600">
                    <th className="px-5 py-3 font-medium">功能</th>
                    <th className="px-5 py-3 text-center font-medium">
                      免费版
                    </th>
                    <th className="px-5 py-3 text-center font-medium text-brand-700">
                      Pro 月度
                    </th>
                    <th className="px-5 py-3 text-center font-medium">
                      Pro 年度
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: "ATS 匹配度评分", free: true, pro: true, life: true },
                    { label: "缺失关键词对照", free: true, pro: true, life: true },
                    {
                      label: "每日使用次数",
                      free: "3 次 / 天",
                      pro: "无限次",
                      life: "无限次",
                    },
                    { label: "基础改写建议", free: true, pro: true, life: true },
                    {
                      label: "STAR 法则深度改写",
                      free: false,
                      pro: true,
                      life: true,
                    },
                    {
                      label: "多份简历管理",
                      free: false,
                      pro: true,
                      life: true,
                    },
                    {
                      label: "求职信一键生成",
                      free: false,
                      pro: true,
                      life: true,
                    },
                    {
                      label: "中英双语导出",
                      free: false,
                      pro: true,
                      life: true,
                    },
                    {
                      label: "历史记录云端保存",
                      free: false,
                      pro: true,
                      life: true,
                    },
                    {
                      label: "未来新功能优先体验",
                      free: false,
                      pro: false,
                      life: true,
                    },
                    {
                      label: "优先客服支持",
                      free: false,
                      pro: false,
                      life: true,
                    },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-slate-800">{row.label}</td>
                      <td className="px-5 py-3 text-center">
                        <Cell value={row.free} />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Cell value={row.pro} highlight />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Cell value={row.life} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="card p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-green-50">
                <RefreshCw className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="mt-4 font-semibold">7 天无理由退款</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                使用次数 ≤ 2 次可全额退款，联系客服即可，不问原因。
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-blue-50">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="mt-4 font-semibold">支付安全加密</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Stripe 银行级加密 / 微信支付宝官方通道，无中间人，无数据泄露。
              </p>
            </div>
            <div className="card p-6 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand-50">
                <Zap className="h-6 w-6 text-brand-600" />
              </div>
              <h4 className="mt-4 font-semibold">支付后立即生效</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Webhook 秒级升级 · 自动扣除免费额度上限 · 随时回到免费版。
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold">定价相关常见问题</h2>
            <div className="mt-10 space-y-3">
              {[
                {
                  q: "Pro 月度到期后会自动续费吗？",
                  a: "通过 Stripe 订阅的会自动续费（可随时取消）；通过微信/支付宝单笔购买的不会自动续费，到期后回到免费版，次月需要手动续。",
                },
                {
                  q: "Pro 年度购买后是如何计时的？",
                  a: "付款成功后立即开始计时，共 365 天。期间无限次使用 Pro 所有功能。到期后会回到免费版（每日 3 次），可随时续费。",
                },
                {
                  q: "可以退款吗？",
                  a: "7 天内、使用次数 ≤ 2 次可申请全额退款。只要满足条件，不问原因、不需要理由，客服会在 3 个工作日内打款。联系邮箱：hi@resumeai.com",
                },
                {
                  q: "发票可以开吗？",
                  a: "Pro 订阅后，发送订单号到客服邮箱即可开具电子发票（增值税普通发票，支持邮箱收取）。",
                },
                {
                  q: "我可以先试用免费版，满意再付费吗？",
                  a: "这就是我们推荐的做法。免费版每日 3 次能让你完整体验 ATS 评分 + 关键词缺口 + 改写建议全流程。一次求职周期完全够用，满意再升级 Pro。",
                },
                {
                  q: "Pro 月度和年度我该选哪个？",
                  a: "如果你只是这一波找工作（1-2 个月），选 Pro 月度（¥9.9）；如果你使用超过 10 个月，或未来一年内还会跳槽 / 需要不时优化简历，选 Pro 年度（¥96）更划算——相当于每月只要 ¥8，比月卡便宜 19%。",
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="card group p-5 [&[open]>summary>svg]:rotate-180"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-slate-900">
                    <span>{item.q}</span>
                    <svg
                      className="h-4 w-4 transition"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-gradient-to-br from-brand-600 to-purple-600 py-16 text-white">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              别在投递 100 份简历之后才想起来优化
            </h2>
            <p className="mt-4 text-white/85">
              先用免费版测一下你现在的简历能打几分
            </p>
            <Link
              href="/analyze"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-medium text-brand-700 shadow-sm hover:bg-slate-100"
            >
              立即免费体验
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Cell({
  value,
  highlight,
}: {
  value: boolean | string;
  highlight?: boolean;
}) {
  if (value === true) {
    return (
      <CheckCircle2
        className={`mx-auto h-5 w-5 ${
          highlight ? "text-brand-600" : "text-green-500"
        }`}
      />
    );
  }
  if (value === false) {
    return <XCircle className="mx-auto h-5 w-5 text-slate-300" />;
  }
  return (
    <span
      className={`text-sm font-medium ${
        highlight ? "text-brand-700" : "text-slate-700"
      }`}
    >
      {value}
    </span>
  );
}
