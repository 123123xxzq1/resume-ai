"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LayoutDashboard, LogOut, Sparkles, CreditCard } from "lucide-react";

type Props = {
  email: string;
  plan: string;
  credits: number;
  avatarUrl?: string | null;
};

export default function UserMenu({ email, plan, credits, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = email?.[0]?.toUpperCase() || "U";
  const planLabel =
    plan === "pro" ? "Pro" : plan === "lifetime" ? "终身" : "免费";
  const planColor =
    plan === "lifetime"
      ? "bg-amber-100 text-amber-700"
      : plan === "pro"
        ? "bg-brand-100 text-brand-700"
        : "bg-slate-100 text-slate-600";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-slate-100"
        aria-label="用户菜单"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-xs font-semibold text-white">
            {initial}
          </div>
        )}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${planColor}`}>
          {planLabel}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="truncate text-sm font-medium text-slate-900">
              {email}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className={`rounded px-1.5 py-0.5 font-medium ${planColor}`}>
                {planLabel}
              </span>
              <span className="text-slate-500">
                {plan === "free" ? `剩余 ${credits} 次` : "无限次"}
              </span>
            </div>
          </div>
          <div className="py-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" />
              控制台
            </Link>
            <Link
              href="/analyze"
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <Sparkles className="h-4 w-4" />
              开始分析
            </Link>
            {plan === "free" && (
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 text-brand-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <CreditCard className="h-4 w-4" />
                升级 Pro
              </Link>
            )}
          </div>
          <form action="/auth/signout" method="post" className="border-t border-slate-100">
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function SignedOutMenu() {
  return (
    <>
      <Link
        href="/sign-in"
        className="hidden text-sm text-slate-600 hover:text-slate-900 sm:inline"
      >
        登录
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <User className="h-3.5 w-3.5" />
        注册
      </Link>
    </>
  );
}
