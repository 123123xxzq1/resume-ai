import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import AnalyzeClient from "./AnalyzeClient";

export const metadata = {
  title: "简历 × JD 智能分析 · ResumeAI",
  description: "上传或粘贴简历 + 目标岗位 JD，30 秒获取 ATS 匹配度评分与改写建议。",
};

export default async function AnalyzePage() {
  let profile: any = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    // Supabase 未配置时，引导用户先配置
  }

  if (!profile) {
    redirect("/sign-in?next=/analyze");
  }

  return (
    <AnalyzeClient
      initialPlan={profile.plan}
      initialCredits={profile.credits}
    />
  );
}
