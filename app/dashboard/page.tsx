import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentProfile } from "@/lib/supabase/server";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import {
  Sparkles,
  CreditCard,
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Crown,
} from "lucide-react";

export const metadata = {
  title: "控制台 · ResumeAI",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { paid?: string };
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/dashboard");

  const supabase = createClient();
  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, score, created_at, model")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, channel, plan, amount_cents, currency, status, created_at, out_trade_no")
    .order("created_at", { ascending: false })
    .limit(5);

  const isUnlimited = profile.plan === "pro" || profile.plan === "lifetime";
  const planLabel =
    profile.plan === "lifetime"
      ? "终身版"
      : profile.plan === "pro"
        ? "Pro"
        : "免费";

  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {searchParams.paid === "1" && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <strong>支付成功！</strong>
                会员状态已生效，如有延迟请刷新页面。
              </div>
            </div>
          )}

          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">控制台</h1>
            <p className="mt-1 text-slate-600">{profile.email}</p>
          </header>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">当前套餐</div>
                {profile.plan === "lifetime" && (
                  <Crown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {planLabel}
              </div>
              {profile.plan === "pro" && profile.plan_expires_at && (
                <div className="mt-1 text-xs text-slate-500">
                  有效期至 {new Date(profile.plan_expires_at).toLocaleDateString()}
                </div>
              )}
              {profile.plan === "free" && (
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  升级 Pro <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="card p-5">
              <div className="text-sm text-slate-500">剩余次数</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {isUnlimited ? "无限" : profile.credits}
              </div>
              {!isUnlimited && profile.credits <= 0 && (
                <Link
                  href="/pricing"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  购买额度 <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="card p-5">
              <div className="text-sm text-slate-500">累计分析</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {profile.total_analyses || 0}
                <span className="ml-1 text-sm font-normal text-slate-400">次</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/analyze"
              className="card group flex items-center justify-between p-5 transition hover:border-brand-500 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  <div className="font-semibold">开始一次新的分析</div>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  上传简历 + JD，30 秒出改写建议
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </Link>

            <Link
              href="/pricing"
              className="card group flex items-center justify-between p-5 transition hover:border-brand-500 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-600" />
                  <div className="font-semibold">
                    {profile.plan === "free" ? "升级会员" : "管理订阅"}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Pro / 终身 版，微信 / 支付宝 / 信用卡
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </Link>
          </div>

          {/* Analyses history */}
          <section className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-slate-700" />
              最近分析记录
            </h2>
            <div className="card overflow-hidden">
              {!analyses || analyses.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <FileText className="h-10 w-10 text-slate-300" />
                  <div className="text-sm text-slate-500">还没有分析记录</div>
                  <Link
                    href="/analyze"
                    className="btn-primary"
                  >
                    开始第一次分析
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {analyses.map((a: any) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-sm font-semibold ${
                            a.score >= 80
                              ? "bg-green-100 text-green-700"
                              : a.score >= 60
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {a.score}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            ATS 评分 {a.score}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(a.created_at).toLocaleString()}
                            <span className="ml-2 text-slate-400">· {a.model}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Orders */}
          {orders && orders.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5 text-slate-700" />
                最近订单
              </h2>
              <div className="card overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {orders.map((o: any) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between px-5 py-3 text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          {o.plan === "pro" ? "Pro 月度" : "终身版"}
                          {o.status === "paid" ? (
                            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                              已支付
                            </span>
                          ) : o.status === "pending" ? (
                            <span className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              <Clock className="h-3 w-3" />
                              待支付
                            </span>
                          ) : (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                              {o.status}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {o.channel === "zpay" ? "微信 / 支付宝" : "Stripe"} ·{" "}
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right font-semibold text-slate-900">
                        {o.currency === "CNY" ? "¥" : "$"}
                        {(o.amount_cents / 100).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
