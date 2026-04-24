import { getCurrentProfile } from "@/lib/supabase/server";
import AnalyzeClient from "./AnalyzeClient";

export const metadata = {
  title: "简历 × JD 智能分析 · ResumeAI",
  description:
    "上传或粘贴简历 + 目标岗位 JD，30 秒获取 ATS 匹配度评分与改写建议。",
};

export default async function AnalyzePage() {
  let profile: any = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase 未配置或查询失败 → 走游客模式
  }

  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  // 已登录 → 使用用户套餐
  if (profile) {
    return (
      <AnalyzeClient
        initialPlan={profile.plan}
        initialCredits={profile.credits}
        mode={hasOpenAI ? "authenticated" : "demo-local"}
      />
    );
  }

  // 游客 / 未登录 / Supabase 未配置 → 降级到游客 / demo 模式
  return (
    <AnalyzeClient
      initialPlan="free"
      initialCredits={hasOpenAI ? 3 : 999}
      mode={hasOpenAI ? "guest" : "demo-local"}
    />
  );
}
