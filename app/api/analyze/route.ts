import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import OpenAI from "openai";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoAnalyze } from "@/lib/demo-analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `你是一位资深的招聘总监和简历教练，精通 ATS (Applicant Tracking System) 打分规则。

你的任务：根据候选人的简历和目标岗位 JD，输出结构化的优化分析。

严格遵守：
1. score：0-100 的整数，严格按 JD 匹配度打分，不要客套给高分。评分依据：关键技能命中率 40% + 经验匹配度 30% + 量化成果 15% + 关键词密度 15%。
2. summary：2-3 句话中文总结整体情况，直接指出核心问题。
3. missingKeywords：JD 中出现但简历中完全没有的硬技能、工具、证书、方法论。只列真正缺失的，去重。最多 10 个。
4. strengths：候选人已有的、与 JD 强相关的亮点，3-5 条，每条 15 字以内。
5. weaknesses：导致扣分的具体问题（如"缺少量化数据"、"技术栈不匹配"），3-5 条，每条 20 字以内。
6. rewrites：挑 2-4 条简历中最有改进空间的 bullet，按 STAR 原则重写。
   - original：原文（简历中真实存在的句子，不要编造）
   - improved：改写后的版本，要求：以强动词开头、包含量化数据（可合理估算百分比/金额/人数）、体现对 JD 关键词的照应
   - reason：一句话说明改了什么、为什么改

只输出 JSON，不要任何 markdown 包裹、不要解释性文字。JSON 结构：
{
  "score": 76,
  "summary": "...",
  "missingKeywords": ["Kubernetes", "..."],
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "rewrites": [
    { "original": "...", "improved": "...", "reason": "..." }
  ]
}`;

const GUEST_COOKIE = "demo_uses";
const GUEST_DAILY_LIMIT = 3;

type GuestUsage = { count: number; resetAt: string };

function readGuestUsage(): GuestUsage {
  try {
    const raw = cookies().get(GUEST_COOKIE)?.value;
    if (!raw) return { count: 0, resetAt: nextMidnightISO() };
    const parsed = JSON.parse(raw) as GuestUsage;
    if (new Date(parsed.resetAt).getTime() <= Date.now()) {
      return { count: 0, resetAt: nextMidnightISO() };
    }
    return parsed;
  } catch {
    return { count: 0, resetAt: nextMidnightISO() };
  }
}

function writeGuestUsage(u: GuestUsage) {
  try {
    cookies().set(GUEST_COOKIE, JSON.stringify(u), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 一周
    });
  } catch {
    // Edge/静态场景下写不了 cookie，忽略
  }
}

function nextMidnightISO(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

export async function POST(req: Request) {
  try {
    const { resume, jd } = await req.json();

    if (!resume || !jd || typeof resume !== "string" || typeof jd !== "string") {
      return NextResponse.json(
        { error: "缺少 resume 或 jd 参数" },
        { status: 400 }
      );
    }

    if (resume.trim().length < 50) {
      return NextResponse.json(
        { error: "简历内容太短，请提供完整简历（至少 50 字）" },
        { status: 400 }
      );
    }

    const hasSupabase = isSupabaseConfigured();
    const apiKey = process.env.OPENAI_API_KEY;
    const hasOpenAI = Boolean(apiKey);

    // ===== State A: OpenAI 未配置 → 本地 Demo 引擎 =====
    if (!hasOpenAI) {
      const result = demoAnalyze(resume, jd);
      return NextResponse.json({
        ...result,
        meta: { ...result.meta, mode: "demo-local" },
      });
    }

    // ===== State B: 已配 OpenAI，但用户未登录 / 未配 Supabase → 游客模式 =====
    let user: { id: string } | null = null;
    if (hasSupabase) {
      try {
        const supabase = createClient();
        const {
          data: { user: u },
        } = await supabase.auth.getUser();
        user = u;
      } catch {
        user = null;
      }
    }

    // 如果已登录 → 走 Supabase 积分逻辑
    if (user && hasSupabase) {
      return await handleAuthenticated(user.id, resume, jd, apiKey!);
    }

    // 未登录（无论 Supabase 是否配置）→ 游客 cookie 限次
    return await handleGuest(resume, jd, apiKey!);
  } catch (e: any) {
    console.error("[analyze] error:", e);
    const msg =
      e?.error?.message || e?.message || "服务器错误，请稍后再试";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ==================== 已登录用户（Supabase 积分）====================
async function handleAuthenticated(
  userId: string,
  resume: string,
  jd: string,
  apiKey: string
) {
  const supabase = createClient();

  // 原子扣积分 (RPC 保证并发安全)
  const { data: consumed, error: rpcError } = await supabase
    .rpc("consume_credit", { p_user_id: userId })
    .single<{ ok: boolean; remaining: number; plan: string }>();

  if (rpcError) {
    console.error("[analyze] consume_credit error:", rpcError);
    return NextResponse.json(
      { error: "用户额度查询失败，请稍后重试" },
      { status: 500 }
    );
  }

  if (!consumed?.ok) {
    return NextResponse.json(
      {
        error: "免费额度已用完，升级 Pro 即可无限次使用",
        code: "no_credits",
      },
      { status: 402 }
    );
  }

  const result = await callOpenAI(resume, jd, apiKey);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // 写历史（尽力而为）
  try {
    const admin = createAdminClient();
    await admin.from("analyses").insert({
      user_id: userId,
      resume_preview: resume.slice(0, 200),
      jd_preview: jd.slice(0, 200),
      score: result.data.score,
      model: result.model,
      tokens_used: result.tokens,
    });
  } catch (e) {
    console.warn("[analyze] save history failed:", e);
  }

  return NextResponse.json({
    ...result.data,
    meta: {
      remainingCredits: consumed.remaining,
      plan: consumed.plan,
      mode: "authenticated",
    },
  });
}

// ==================== 游客模式（cookie 限次）====================
async function handleGuest(resume: string, jd: string, apiKey: string) {
  const usage = readGuestUsage();
  const remaining = Math.max(0, GUEST_DAILY_LIMIT - usage.count);

  if (remaining <= 0) {
    return NextResponse.json(
      {
        error: `今日免费额度已用完（${GUEST_DAILY_LIMIT} 次/天）。注册账号或明天再试。`,
        code: "guest_limit_reached",
      },
      { status: 429 }
    );
  }

  const result = await callOpenAI(resume, jd, apiKey);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // 扣一次
  const newUsage: GuestUsage = {
    count: usage.count + 1,
    resetAt: usage.resetAt,
  };
  writeGuestUsage(newUsage);

  return NextResponse.json({
    ...result.data,
    meta: {
      remainingCredits: Math.max(0, GUEST_DAILY_LIMIT - newUsage.count),
      plan: "guest",
      mode: "guest",
    },
  });
}

// ==================== 公共 OpenAI 调用 ====================
type OpenAIOk = {
  ok: true;
  data: {
    score: number;
    summary: string;
    missingKeywords: string[];
    strengths: string[];
    weaknesses: string[];
    rewrites: { original: string; improved: string; reason: string }[];
  };
  model: string;
  tokens: number | null;
};
type OpenAIFail = { ok: false; error: string; status: number };

async function callOpenAI(
  resume: string,
  jd: string,
  apiKey: string
): Promise<OpenAIOk | OpenAIFail> {
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const userPrompt = `# 简历内容\n\n${resume.slice(0, 12000)}\n\n# 目标岗位 JD\n\n${jd.slice(0, 6000)}\n\n请严格按 system 指令输出 JSON。`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "AI 返回格式异常，请重试", status: 502 };
  }

  return {
    ok: true,
    data: {
      score: clampScore(parsed.score),
      summary:
        String(parsed.summary || "").trim() || "未能生成总结，请重试。",
      missingKeywords: toStringArray(parsed.missingKeywords).slice(0, 10),
      strengths: toStringArray(parsed.strengths).slice(0, 6),
      weaknesses: toStringArray(parsed.weaknesses).slice(0, 6),
      rewrites: toRewrites(parsed.rewrites).slice(0, 5),
    },
    model,
    tokens: completion.usage?.total_tokens || null,
  };
}

function clampScore(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function toStringArray(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim());
}

function toRewrites(
  v: any
): { original: string; improved: string; reason: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter(
      (x) =>
        x &&
        typeof x.original === "string" &&
        typeof x.improved === "string" &&
        x.original.trim() &&
        x.improved.trim()
    )
    .map((x) => ({
      original: x.original.trim(),
      improved: x.improved.trim(),
      reason: (x.reason || "").toString().trim(),
    }));
}
