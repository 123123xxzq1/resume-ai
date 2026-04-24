"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/analyze";

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErr(error.message.includes("Invalid login")
        ? "邮箱或密码错误"
        : error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function onGoogle() {
    setErr(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 self-center font-semibold"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-xl">ResumeAI</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-slate-900">登录</h1>
          <p className="mt-1 text-sm text-slate-500">
            还没有账号？
            <Link href="/sign-up" className="ml-1 font-medium text-brand-600 hover:text-brand-700">
              免费注册
            </Link>
          </p>

          {!supabaseConfigured && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="text-sm text-blue-900">
                  <div className="font-semibold">
                    登录 / 注册功能内测中
                  </div>
                  <div className="mt-1 text-blue-800">
                    预计 1-2 周开放。现阶段你可以
                    <Link
                      href="/analyze"
                      className="ml-1 font-semibold underline underline-offset-2 hover:text-blue-700"
                    >
                      直接用游客模式体验
                    </Link>
                    ，每日 3 次完整分析，无需注册。
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">邮箱</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  disabled={!supabaseConfigured}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">密码</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  disabled={!supabaseConfigured}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="至少 6 位"
                />
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{err}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !supabaseConfigured}
              className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {supabaseConfigured ? "登录" : "登录即将开放"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>或</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={!supabaseConfigured}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            使用 Google 登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignInForm />
    </Suspense>
  );
}
