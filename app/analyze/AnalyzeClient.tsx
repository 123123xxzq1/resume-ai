"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Lightbulb,
} from "lucide-react";

type AnalyzeResult = {
  score: number;
  summary: string;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  rewrites: { original: string; improved: string; reason: string }[];
  meta?: { remainingCredits: number; plan: string };
};

type Props = {
  initialPlan: "free" | "pro" | "lifetime";
  initialCredits: number;
};

export default function AnalyzeClient({ initialPlan, initialCredits }: Props) {
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needUpgrade, setNeedUpgrade] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [plan, setPlan] = useState(initialPlan);
  const [credits, setCredits] = useState(initialCredits);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const unlimited = plan === "pro" || plan === "lifetime";
  const blocked = !unlimited && credits <= 0;

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-pdf", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "PDF 解析失败");
        setResume(data.text);
        setFileName(file.name);
      } else if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
        const text = await file.text();
        setResume(text);
        setFileName(file.name);
      } else {
        throw new Error("仅支持 PDF 或 TXT。Word 请另存为 PDF 或直接粘贴内容。");
      }
    } catch (e: any) {
      setError(e.message || "文件处理失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    setError(null);
    setResult(null);

    if (!resume.trim() || !jd.trim()) {
      setError("请同时提供简历内容和岗位 JD");
      return;
    }
    if (resume.trim().length < 50) {
      setError("简历内容太短，请提供完整简历");
      return;
    }
    if (blocked) {
      setError("免费次数已用完，请升级会员继续使用");
      return;
    }

    setLoading(true);
    setNeedUpgrade(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jd }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/sign-in?next=${encodeURIComponent("/analyze")}`;
          return;
        }
        if (res.status === 402 || data.code === "no_credits") {
          setNeedUpgrade(true);
        }
        throw new Error(data.error || "分析失败");
      }
      setResult(data);
      if (data.meta) {
        setCredits(data.meta.remainingCredits);
        setPlan(data.meta.plan);
      }
    } catch (e: any) {
      setError(e.message || "分析失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3 w-3" />
            {unlimited
              ? `${plan === "lifetime" ? "终身" : "Pro"} · 无限次`
              : `剩余免费次数：${credits}`}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">简历 × JD 智能分析</h1>
          <p className="mt-2 text-slate-600">
            上传或粘贴你的简历，附上目标岗位 JD，30 秒获取改写建议。
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resume Input */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                <h2 className="font-semibold">你的简历</h2>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                上传 PDF
                <input
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f);
                  }}
                />
              </label>
            </div>
            {fileName && (
              <div className="mb-3 flex items-center gap-2 rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700">
                <CheckCircle2 className="h-3 w-3" />
                已导入 {fileName}
              </div>
            )}
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="粘贴简历内容，或上传 PDF 自动识别。示例：&#10;&#10;张三，5 年全栈开发经验。&#10;- 在 ABC 公司负责电商平台开发，使用 React + Node.js...&#10;..."
              className="h-80 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            <div className="mt-2 text-right text-xs text-slate-400">
              {resume.length} 字
            </div>
          </div>

          {/* JD Input */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold">目标岗位 JD</h2>
            </div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="粘贴招聘 JD 原文。示例：&#10;&#10;高级前端工程师&#10;- 3 年以上 React 经验&#10;- 熟悉 TypeScript、Next.js&#10;- 了解性能优化..."
              className="h-80 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            <div className="mt-2 text-right text-xs text-slate-400">
              {jd.length} 字
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mt-6 flex flex-col items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={loading || blocked}
            className="btn-primary px-8 py-3 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI 分析中（约 15-30 秒）...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                开始分析
              </>
            )}
          </button>
          {(blocked || needUpgrade) && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-center">
              <p className="text-sm text-amber-900">
                免费次数已用完，升级 Pro 即可<strong>无限次使用</strong>
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                查看订阅方案
              </Link>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <section className="mt-10 animate-fade-in-up space-y-6">
            {/* Score */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">ATS 匹配度评分</div>
                  <div className="mt-1 text-5xl font-bold text-slate-900">
                    {result.score}
                    <span className="text-xl text-slate-400"> / 100</span>
                  </div>
                </div>
                <ScoreBadge score={result.score} />
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scoreColor(
                    result.score
                  )}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                {result.summary}
              </p>
            </div>

            {/* Missing Keywords */}
            {result.missingKeywords.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <XCircle className="h-5 w-5 text-red-500" />
                  缺失的关键词（JD 要求但你简历未出现）
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <div className="card p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  你的优势
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="card p-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  待改进的点
                </h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-amber-500">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rewrites */}
            {result.rewrites.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Sparkles className="h-5 w-5 text-brand-600" />
                  逐条改写建议（Before → After）
                </h3>
                <div className="space-y-5">
                  {result.rewrites.map((r, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3">
                        <div className="mb-1 text-xs font-medium text-slate-500">
                          原文
                        </div>
                        <div className="rounded bg-red-50/50 p-3 text-sm text-slate-700">
                          {r.original}
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="mb-1 text-xs font-medium text-slate-500">
                          改写后
                        </div>
                        <div className="rounded bg-green-50/50 p-3 text-sm text-slate-800">
                          {r.improved}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-medium">改写理由：</span>
                        {r.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function ScoreBadge({ score }: { score: number }) {
  let label = "有待提升";
  let cls = "bg-red-100 text-red-700";
  if (score >= 80) {
    label = "非常匹配";
    cls = "bg-green-100 text-green-700";
  } else if (score >= 60) {
    label = "还算匹配";
    cls = "bg-amber-100 text-amber-700";
  }
  return (
    <div className={`rounded-full px-4 py-1.5 text-sm font-medium ${cls}`}>
      {label}
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-gradient-to-r from-green-400 to-green-600";
  if (score >= 60) return "bg-gradient-to-r from-amber-400 to-amber-600";
  return "bg-gradient-to-r from-red-400 to-red-600";
}
