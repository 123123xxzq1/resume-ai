import crypto from "node:crypto";
import { PLANS } from "./plans";
import type {
  CreateCheckoutInput,
  CreateCheckoutOutput,
  PaymentProvider,
} from "./types";

/**
 * 爱发电 (afdian.net) 赞助支付集成
 *
 * 流程：用户点击购买 → 跳转爱发电赞助页 → 付款 → webhook 回调自动升级
 *
 * Webhook 签名：MD5(token + "params" + JSON.stringify(data))
 *
 * 环境变量：
 *   AFDIAN_TOKEN            - API token（开发者设置中获取）
 *   AFDIAN_USER_ID          - 你的爱发电 user_id（数字字符串）
 *   AFDIAN_PAGE_URL         - 你的爱发电主页，如 https://afdian.net/a/myname
 *   AFDIAN_PLAN_PRO_MONTHLY - Pro 月度方案的 plan_id
 *   AFDIAN_PLAN_LIFETIME    - 终身版方案的 plan_id
 */

// ==================== 签名 ====================

export function afdianSign(token: string, paramsJson: string): string {
  return crypto
    .createHash("md5")
    .update(token + "params" + paramsJson, "utf8")
    .digest("hex");
}

export function verifyAfdianSign(
  token: string,
  dataJson: string,
  sign: string
): boolean {
  const expected = afdianSign(token, dataJson);
  return expected === String(sign || "").toLowerCase();
}

// ==================== Plan 映射 ====================

/** 爱发电 plan_id → 我们的 PlanId */
export function resolveOurPlanId(afdianPlanId: string): string | null {
  if (afdianPlanId === process.env.AFDIAN_PLAN_PRO_MONTHLY) return "pro_monthly";
  if (afdianPlanId === process.env.AFDIAN_PLAN_LIFETIME) return "lifetime";
  return null;
}

/** 我们的 PlanId → 爱发电 plan_id */
function toAfdianPlanId(planId: string): string | null {
  const map: Record<string, string | undefined> = {
    pro_monthly: process.env.AFDIAN_PLAN_PRO_MONTHLY,
    lifetime: process.env.AFDIAN_PLAN_LIFETIME,
  };
  return map[planId] || null;
}

// ==================== Provider ====================

export const afdianProvider: PaymentProvider = {
  channel: "afdian",

  isConfigured() {
    return Boolean(
      process.env.AFDIAN_TOKEN &&
        process.env.AFDIAN_USER_ID &&
        process.env.AFDIAN_PAGE_URL
    );
  },

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutOutput> {
    const plan = PLANS[input.planId];
    if (!plan) throw new Error("未知套餐: " + input.planId);

    const pageUrl = process.env.AFDIAN_PAGE_URL!;
    const afdianPlanId = toAfdianPlanId(input.planId);

    // 构建爱发电赞助链接
    const url = new URL(pageUrl);
    if (afdianPlanId) {
      url.searchParams.set("plan_id", afdianPlanId);
    }
    // 附带我们的订单号，爱发电会在 webhook 中回传
    url.searchParams.set("custom_order_id", input.outTradeNo);

    return {
      channel: "afdian",
      redirectUrl: url.toString(),
    };
  },
};
