import crypto from "node:crypto";
import { PLANS } from "./plans";
import type {
  CreateCheckoutInput,
  CreateCheckoutOutput,
  PaymentProvider,
} from "./types";

/**
 * ZPay / 易支付协议
 * 兼容：zpay.com.cn、彩虹易支付、码支付、虎皮椒 等
 *
 * 支付发起：GET 跳转到 {gateway}/submit.php?{params}&sign={sign}&sign_type=MD5
 * 异步回调：GET notify_url?{params}&sign={...}&sign_type=MD5，返回纯文本 "success"
 * 签名算法：按参数名 ASCII 升序，拼接 k=v&... + key，取 md5 小写
 */

type ZPayParams = Record<string, string | number | undefined>;

export function zpayGateway(): string {
  return (process.env.ZPAY_GATEWAY || "https://z-pay.cn").replace(/\/$/, "");
}

export function zpaySign(params: ZPayParams, key: string): string {
  const entries = Object.entries(params)
    .filter(
      ([k, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        k !== "sign" &&
        k !== "sign_type"
    )
    .sort(([a], [b]) => a.localeCompare(b));
  const str = entries.map(([k, v]) => `${k}=${v}`).join("&") + key;
  return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

export function verifyZPaySign(
  params: ZPayParams,
  sign: string,
  key: string
): boolean {
  const expected = zpaySign(params, key);
  return expected === String(sign || "").toLowerCase();
}

export const zpayProvider: PaymentProvider = {
  channel: "zpay",

  isConfigured() {
    return Boolean(process.env.ZPAY_PID && process.env.ZPAY_KEY);
  },

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutOutput> {
    const pid = process.env.ZPAY_PID!;
    const key = process.env.ZPAY_KEY!;
    const plan = PLANS[input.planId];
    if (!plan) throw new Error("未知套餐: " + input.planId);

    const params: ZPayParams = {
      pid,
      type: "wxpay",            // wxpay / alipay / qqpay 等
      out_trade_no: input.outTradeNo,
      notify_url: input.notifyUrl,
      return_url: input.successUrl,
      name: `ResumeAI ${plan.name}`,
      money: plan.priceCNY.toFixed(2),
      param: input.planId,       // 业务参数，回调会原样带回
      sign_type: "MD5",
    };

    const sign = zpaySign(params, key);
    const query = new URLSearchParams({
      ...(Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      ) as Record<string, string>),
      sign,
    }).toString();

    const url = `${zpayGateway()}/submit.php?${query}`;

    return {
      channel: "zpay",
      redirectUrl: url,
    };
  },
};
