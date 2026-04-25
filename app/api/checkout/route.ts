import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/payments/plans";
import { stripeProvider } from "@/lib/payments/stripe";
import { zpayProvider } from "@/lib/payments/zpay";
import { afdianProvider } from "@/lib/payments/afdian";
import type { Channel, PaymentProvider } from "@/lib/payments/types";
import { SITE, absoluteUrl } from "@/lib/site";

export const runtime = "nodejs";

function generateOrderNo(): string {
  const ts = Date.now().toString();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RA${ts}${rand}`;
}

function pickProvider(channel: Channel): PaymentProvider {
  if (channel === "stripe") return stripeProvider;
  if (channel === "afdian") return afdianProvider;
  return zpayProvider;
}

export async function POST(req: Request) {
  try {
    const { planId, channel } = (await req.json()) as {
      planId: PlanId;
      channel: Channel;
    };

    if (!planId || !(planId in PLANS)) {
      return NextResponse.json({ error: "无效的套餐" }, { status: 400 });
    }
    if (channel !== "stripe" && channel !== "zpay" && channel !== "afdian") {
      return NextResponse.json({ error: "无效的支付通道" }, { status: 400 });
    }

    // 认证
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "服务端用户系统未配置" },
        { status: 503 }
      );
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "请先登录", code: "unauthorized" },
        { status: 401 }
      );
    }

    const provider = pickProvider(channel);
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          error:
            channel === "stripe"
              ? "Stripe 未配置，请先设置 STRIPE_SECRET_KEY"
              : channel === "afdian"
                ? "爱发电未配置，请先设置 AFDIAN_TOKEN"
                : "ZPay 未配置，请先设置 ZPAY_PID / ZPAY_KEY",
        },
        { status: 503 }
      );
    }

    const plan = PLANS[planId];
    const outTradeNo = generateOrderNo();

    // 落库 pending 订单
    const admin = createAdminClient();
    const { error: insertError } = await admin.from("orders").insert({
      user_id: user.id,
      channel,
      out_trade_no: outTradeNo,
      plan: plan.plan,
      amount_cents: Math.round(
        (channel === "stripe" ? plan.priceUSD : plan.priceCNY) * 100
      ),
      currency: channel === "stripe" ? "USD" : "CNY",
      status: "pending",
    });
    if (insertError) {
      console.error("[checkout] insert order error:", insertError);
      return NextResponse.json({ error: "订单创建失败" }, { status: 500 });
    }

    const origin = SITE.url;
    const checkout = await provider.createCheckout({
      userId: user.id,
      userEmail: user.email || "",
      planId,
      outTradeNo,
      successUrl: `${origin}/dashboard?paid=1`,
      cancelUrl: `${origin}/pricing?canceled=1`,
      notifyUrl: absoluteUrl(
        channel === "stripe"
          ? "/api/webhooks/stripe"
          : channel === "afdian"
            ? "/api/webhooks/afdian"
            : "/api/webhooks/zpay"
      ),
    });

    // 回填 providerOrderId（Stripe session id）
    if (checkout.providerOrderId) {
      await admin
        .from("orders")
        .update({ provider_order_id: checkout.providerOrderId })
        .eq("out_trade_no", outTradeNo);
    }

    return NextResponse.json({
      redirectUrl: checkout.redirectUrl,
      outTradeNo,
    });
  } catch (e: any) {
    console.error("[checkout] error:", e);
    return NextResponse.json(
      { error: e?.message || "服务器错误" },
      { status: 500 }
    );
  }
}
