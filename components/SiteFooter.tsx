import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
        <div>© {new Date().getFullYear()} ResumeAI · 用 AI 帮你拿到更好的 offer</div>
        <div className="flex gap-6">
          <Link href="/blog" className="hover:text-slate-900">博客</Link>
          <Link href="/pricing" className="hover:text-slate-900">定价</Link>
          <Link href="/feed.xml" className="hover:text-slate-900">RSS</Link>
          <Link href="/privacy" className="hover:text-slate-900">隐私</Link>
          <Link href="/terms" className="hover:text-slate-900">条款</Link>
        </div>
      </div>
    </footer>
  );
}
