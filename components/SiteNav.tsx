import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/server";
import UserMenu, { SignedOutMenu } from "./UserMenu";

export default async function SiteNav() {
  let profile: any = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase 未配置时静默降级
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg">ResumeAI</span>
        </Link>
        <div className="flex items-center gap-4 text-sm sm:gap-6">
          <Link
            href="/#features"
            className="hidden text-slate-600 hover:text-slate-900 sm:inline"
          >
            功能
          </Link>
          <Link
            href="/blog"
            className="hidden text-slate-600 hover:text-slate-900 sm:inline"
          >
            博客
          </Link>
          <Link
            href="/pricing"
            className="hidden text-slate-600 hover:text-slate-900 sm:inline"
          >
            定价
          </Link>
          {profile ? (
            <>
              <Link href="/analyze" className="btn-primary">
                开始分析
                <ArrowRight className="h-4 w-4" />
              </Link>
              <UserMenu
                email={profile.email || ""}
                plan={profile.plan}
                credits={profile.credits}
                avatarUrl={profile.avatar_url}
              />
            </>
          ) : (
            <SignedOutMenu />
          )}
        </div>
      </div>
    </nav>
  );
}
