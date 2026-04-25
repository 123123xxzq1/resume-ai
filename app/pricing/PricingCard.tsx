"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, CreditCard, AlertCircle } from "lucide-react";
import type { PlanDef } from "@/lib/payments/plans";
import type { Channel } from "@/lib/payments/types";

type Props = {
  plan: PlanDef;
  isLoggedIn: boolean;
  stripeEnabled: boolean;
  zpayEnabled: boolean;
  afdianEnabled: boolean;
};

export default function PricingCard({ plan, isLoggedIn, stripeEnabled, zpayEnabled, afdianEnabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<Channel | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleBuy(channel: Channel) {
    setErr(null);
    if (!isLoggedIn) {
      router.push(`/sign-in?next=/pricing`);
      return;
    }
    setLoading(channel);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发起支付失败");
      window.location.href = data.redirectUrl;
    } catch (e: any) {
      setErr(e.message || "支付失败");
      setLoading(null);
    }
  }

  return (
    <div
      className={`card relative flex flex-col p-8 transition ${
        plan.highlight ? "border-2 border-brand-500 shadow-lg" : ""
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {plan.badge}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900">¥{plan.priceCNY}</span>
          <span className="text-sm text-slate-500">
            {plan.durationDays === 30
              ? " / 月"
              : plan.durationDays === 365
                ? " / 年"
                : plan.durationDays
                  ? ` / ${plan.durationDays} 天`
                  : " · 终身"}
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-400">
          海外 ${plan.priceUSD}
          {plan.durationDays === 30
            ? " / 月"
            : plan.durationDays === 365
              ? " / 年"
              : " · 一次性"}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {err && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      <div className="space-y-2">
        {/* 爱发电：微信 / 支付宝 赞助 */}
        <button
          onClick={() => handleBuy("afdian")}
          disabled={!afdianEnabled || loading !== null}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-purple-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "afdian" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              微信 / 支付宝 赞助解锁
            </>
          )}
        </button>

        {/* ZPay 备用 */}
        {zpayEnabled && (
          <button
            onClick={() => handleBuy("zpay")}
            disabled={loading !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "zpay" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                微信 / 支付宝 (ZPay)
              </>
            )}
          </button>
        )}

        {/* Stripe 海外卡 */}
        {stripeEnabled && (
          <button
            onClick={() => handleBuy("stripe")}
            disabled={loading !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "stripe" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                海外信用卡 (Stripe)
              </>
            )}
          </button>
        )}
      </div>

      {!isLoggedIn && (
        <p className="mt-3 text-center text-xs text-slate-400">
          点击将先跳转登录
        </p>
      )}
    </div>
  );
}
