"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function SignUpForm() {
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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    // Supabase 如果开启了邮箱验证，data.session 为 null；否则直接登录
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
          <div className="card p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">注册成功</h2>
            <p className="mt-2 text-sm text-slate-600">
              我们已给 <strong>{email}</strong> 发送了验证邮件，点击链接即可激活账号。
            </p>
            <Link
              href="/sign-in"
              className="btn-primary mt-6 w-full justify-center"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-semibold text-slate-900">创建账号</h1>
          <p className="mt-1 text-sm text-slate-500">
            注册即送 <strong className="text-brand-700">3 次免费分析</strong>
          </p>

          {!supabaseConfigured && (
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="text-sm text-blue-900">
                  <div className="font-semibold">
                    注册功能内测中
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
              {supabaseConfigured ? "注册" : "注册即将开放"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            已有账号？
            <Link href="/sign-in" className="ml-1 font-medium text-brand-600 hover:text-brand-700">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <SignUpForm />
    </Suspense>
  );
}
