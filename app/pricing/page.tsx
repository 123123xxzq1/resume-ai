import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import PricingCard from "./PricingCard";
import { PLANS } from "@/lib/payments/plans";
import { getCurrentUser } from "@/lib/supabase/server";
import { stripeProvider } from "@/lib/payments/stripe";
import { zpayProvider } from "@/lib/payments/zpay";
import { Gift, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "定价 · ResumeAI",
  description:
    "ResumeAI 订阅方案：Pro 月度 ¥39，终身版 ¥299。无限次简历分析 + ATS 评分 + 关键词对照 + STAR 改写。",
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

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50">
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              选一个最划算的方案
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
              注册即送 <strong className="text-brand-700">3 次免费</strong>。
              满意后再付费，支持微信 / 支付宝 / 海外信用卡。
            </p>

            {searchParams.canceled === "1" && (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm text-amber-700">
                <span>⚠️ 支付已取消，你可以随时再来</span>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <PricingCard
              plan={PLANS.pro_monthly}
              isLoggedIn={isLoggedIn}
              stripeEnabled={stripeEnabled}
              zpayEnabled={zpayEnabled}
            />
            <PricingCard
              plan={PLANS.lifetime}
              isLoggedIn={isLoggedIn}
              stripeEnabled={stripeEnabled}
              zpayEnabled={zpayEnabled}
            />
          </div>

          {!stripeEnabled && !zpayEnabled && (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              ⚠️ 管理员未配置支付通道。请在 <code>.env</code> 中填写 <code>STRIPE_SECRET_KEY</code> 或 <code>ZPAY_PID/ZPAY_KEY</code>。
            </div>
          )}

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="card p-5 text-center">
              <Gift className="mx-auto h-8 w-8 text-brand-600" />
              <h4 className="mt-3 font-semibold">3 次免费试用</h4>
              <p className="mt-1 text-sm text-slate-500">
                无需付费即可体验完整功能
              </p>
            </div>
            <div className="card p-5 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-brand-600" />
              <h4 className="mt-3 font-semibold">安全支付</h4>
              <p className="mt-1 text-sm text-slate-500">
                Stripe / 易支付协议 加密通道
              </p>
            </div>
            <div className="card p-5 text-center">
              <Zap className="mx-auto h-8 w-8 text-brand-600" />
              <h4 className="mt-3 font-semibold">支付后立即生效</h4>
              <p className="mt-1 text-sm text-slate-500">
                Webhook 秒级升级会员
              </p>
            </div>
          </div>

          <div className="mt-16 space-y-6">
            <h2 className="text-center text-2xl font-bold">常见问题</h2>
            <div className="mx-auto max-w-3xl space-y-3">
              {[
                {
                  q: "Pro 月度到期后会自动续费吗？",
                  a: "通过 Stripe 订阅的会自动续费；通过微信/支付宝单笔购买的不会自动续费，到期需要手动续。",
                },
                {
                  q: "终身版是永久有效吗？",
                  a: "是。只要产品还在运营，终身版账号就可以无限次使用当前所有功能，未来新功能免费升级。",
                },
                {
                  q: "可以退款吗？",
                  a: "支付后 7 天内，如果未使用或使用次数 ≤ 2 次，可申请全额退款。联系邮箱：hi@resumeai.com",
                },
                {
                  q: "发票可以开吗？",
                  a: "Pro / 终身 订阅后，发送订单号到客服邮箱即可开具电子发票。",
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
                  <p className="mt-3 text-sm text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
