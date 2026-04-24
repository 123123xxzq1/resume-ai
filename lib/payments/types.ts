import type { PlanId } from "./plans";

export type Channel = "stripe" | "zpay";

export type CreateCheckoutInput = {
  userId: string;
  userEmail: string;
  planId: PlanId;
  outTradeNo: string;
  successUrl: string;
  cancelUrl: string;
  notifyUrl: string;          // 服务器回调地址（ZPay notify / Stripe webhook）
};

export type CreateCheckoutOutput = {
  /** 通道 */
  channel: Channel;
  /** 跳转 URL（ZPay 直接访问此 URL 完成支付；Stripe 也是 checkout.url） */
  redirectUrl: string;
  /** 服务商订单号（Stripe session.id / ZPay trade_no 等） */
  providerOrderId?: string;
};

export interface PaymentProvider {
  readonly channel: Channel;
  /** 是否已配置好（.env 齐全） */
  isConfigured(): boolean;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput>;
}
