import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/payments/plans";

export const runtime = "nodejs";
// 必须关闭 body 解析，Stripe 需要原始 bytes 验签
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET 未配置");
    return new NextResponse("missing_secret", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("missing_signature", { status: 400 });

  const stripe = getStripe();
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    console.error("[stripe-webhook] signature verify failed:", e.message);
    return new NextResponse(`invalid_signature: ${e.message}`, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const outTradeNo = s.metadata?.out_trade_no;
        const userId = s.metadata?.user_id;
        const planId = s.metadata?.plan_id as PlanId | undefined;
        if (!outTradeNo || !userId || !planId) {
          console.warn("[stripe-webhook] missing metadata:", s.id);
          break;
        }
        await fulfillOrder(admin, {
          outTradeNo,
          userId,
          planId,
          raw: s,
          channel: "stripe",
        });
        break;
      }
      case "invoice.paid": {
        // 订阅续费
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = invoice.customer_email;
        if (!customerEmail) break;
        // 延长 30 天
        const { data: users } = await admin
          .from("profiles")
          .select("id, plan_expires_at")
          .eq("email", customerEmail)
          .limit(1);
        if (users?.[0]) {
          const now = Date.now();
          const current = users[0].plan_expires_at
            ? new Date(users[0].plan_expires_at).getTime()
            : now;
          const base = Math.max(now, current);
          const newExpires = new Date(base + 30 * 24 * 3600 * 1000).toISOString();
          await admin
            .from("profiles")
            .update({ plan: "pro", plan_expires_at: newExpires })
            .eq("id", users[0].id);
        }
        break;
      }
      default:
        // 忽略其他事件
        break;
    }
  } catch (e: any) {
    console.error("[stripe-webhook] handler error:", e);
    return new NextResponse("handler_error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(
  admin: ReturnType<typeof createAdminClient>,
  args: {
    outTradeNo: string;
    userId: string;
    planId: PlanId;
    channel: "stripe" | "zpay";
    raw: any;
  }
) {
  const plan = PLANS[args.planId];
  if (!plan) throw new Error("unknown plan: " + args.planId);

  // 幂等：如果订单已经是 paid，就不再处理
  const { data: existing } = await admin
    .from("orders")
    .select("status")
    .eq("out_trade_no", args.outTradeNo)
    .maybeSingle();

  if (existing?.status === "paid") {
    console.log("[webhook] order already paid:", args.outTradeNo);
    return;
  }

  // 更新订单
  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      raw: args.raw,
    })
    .eq("out_trade_no", args.outTradeNo);

  // 升级 profile
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_expires_at")
    .eq("id", args.userId)
    .single();

  const now = Date.now();
  let newExpires: string | null = null;
  if (plan.durationDays) {
    const current = profile?.plan_expires_at
      ? new Date(profile.plan_expires_at).getTime()
      : now;
    const base = Math.max(now, current);
    newExpires = new Date(base + plan.durationDays * 24 * 3600 * 1000).toISOString();
  }

  await admin
    .from("profiles")
    .update({
      plan: plan.plan,
      plan_expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.userId);

  console.log(
    `[webhook:${args.channel}] fulfilled order ${args.outTradeNo} → ${plan.plan}`
  );
}
