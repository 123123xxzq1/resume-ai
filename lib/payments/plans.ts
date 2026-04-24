export type PlanId = "pro_monthly" | "lifetime";

export type PlanDef = {
  id: PlanId;
  name: string;
  plan: "pro" | "lifetime";       // 对应 profiles.plan
  priceCNY: number;               // 人民币元（ZPay 用）
  priceUSD: number;               // 美元（Stripe 用，参考值）
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
    priceCNY: 39,
    priceUSD: 5.9,
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
  lifetime: {
    id: "lifetime",
    name: "终身版",
    plan: "lifetime",
    priceCNY: 299,
    priceUSD: 39,
    durationDays: null,
    description: "一次付费，终身使用",
    features: [
      "Pro 所有功能",
      "终身无限次使用",
      "未来新功能免费升级",
      "优先客服支持",
    ],
  },
};

export function getPlan(id: string): PlanDef | null {
  return (PLANS as any)[id] || null;
}
