import Stripe from "stripe";
import { PLANS } from "./plans";
import type {
  CreateCheckoutInput,
  CreateCheckoutOutput,
  PaymentProvider,
} from "./types";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY 未配置");
  _stripe = new Stripe(key, { apiVersion: "2024-09-30.acacia" as any });
  return _stripe;
}

function priceIdFor(planId: string): string | null {
  if (planId === "pro_monthly") return process.env.STRIPE_PRICE_PRO_MONTHLY || null;
  if (planId === "pro_yearly") return process.env.STRIPE_PRICE_PRO_YEARLY || null;
  return null;
}

export const stripeProvider: PaymentProvider = {
  channel: "stripe",

  isConfigured() {
    return Boolean(
      process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    );
  },

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    const stripe = getStripe();
    const plan = PLANS[input.planId];
    if (!plan) throw new Error("未知的套餐：" + input.planId);

    const priceId = priceIdFor(input.planId);

    // 优先用预配置的 price_id；否则用 price_data 动态创建（方便初次跑起来）
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: `ResumeAI ${plan.name}`,
              description: plan.description,
            },
            unit_amount: Math.round(plan.priceUSD * 100),
            ...(plan.durationDays
              ? { recurring: { interval: "month" } }
              : {}),
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: plan.durationDays ? "subscription" : "payment",
      line_items: [lineItem],
      customer_email: input.userEmail,
      client_reference_id: input.userId,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: {
        user_id: input.userId,
        plan_id: input.planId,
        out_trade_no: input.outTradeNo,
      },
    });

    if (!session.url) throw new Error("Stripe 未返回 checkout url");

    return {
      channel: "stripe",
      redirectUrl: session.url,
      providerOrderId: session.id,
    };
  },
};
