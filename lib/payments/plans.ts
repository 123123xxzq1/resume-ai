export type PlanId = "pro_monthly" | "pro_yearly";

export type PlanDef = {
  id: PlanId;
  name: string;
  plan: "pro" | "lifetime";       // 对应 profiles.plan（lifetime 保留以兼容历史数据）
  priceCNY: number;               // 人民币元
  priceUSD: number;               // 美元（参考值）
  durationDays: number | null;    // null = 终身
  description: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
};

export const PLANS: Record<PlanId, PlanDef> = {
  pro_monthly: {
    id: "pro_monthly",
    name: "Pro 月度",
    plan: "pro",
    priceCNY: 9.9,
    priceUSD: 1.49,
    durationDays: 30,
    description: "适合正在找工作的你",
    features: [
      "无限次简历分析",
      "ATS 匹配度评分",
      "缺失关键词对照",
      "STAR 法则改写",
      "30 天内无限使用",
    ],
    highlight: true,
    badge: "最受欢迎",
  },
  pro_yearly: {
    id: "pro_yearly",
    name: "Pro 年度",
    plan: "pro",
    priceCNY: 96,
    priceUSD: 14.9,
    durationDays: 365,
    description: "一年无限次，按月仅 ¥8 元",
    features: [
      "Pro 所有功能",
      "365 天内无限次使用",
      "按月仅 ¥8，比月卡便宜 19%",
      "优先客服支持",
    ],
  },
};

export function getPlan(id: string): PlanDef | null {
  return (PLANS as any)[id] || null;
}
