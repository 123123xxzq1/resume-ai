import { NextResponse } from "next/server";
import { verifyAfdianSign, resolveOurPlanId } from "@/lib/payments/afdian";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/payments/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 爱发电 Webhook 回调
 *
 * 爱发电 POST JSON:
 * {
 *   "ec": 200,
 *   "em": "ok",
 *   "data": {
 *     "type": "order",
 *     "order": {
 *       "out_trade_no": "afdian 内部单号",
 *       "custom_order_id": "我们的 out_trade_no",
 *       "plan_id": "爱发电方案 id",
 *       "user_id": "买家 afdian uid",
 *       "total_amount": "9.90",
 *       "status": 2,        // 2 = 已支付
 *       "remark": "留言",
 *       ...
 *     }
 *   },
 *   "sign": "md5 签名"
 * }
 */

export async function POST(req: Request) {
  const token = process.env.AFDIAN_TOKEN;
  if (!token) {
    console.error("[afdian-webhook] AFDIAN_TOKEN 未配置");
    return NextResponse.json({ ec: 500, em: "not configured" });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ec: 400, em: "bad json" });
  }

  // 验签: MD5(token + "params" + JSON.stringify(body.data))
  const dataStr = JSON.stringify(body.data || {});
  if (!verifyAfdianSign(token, dataStr, body.sign || "")) {
    console.warn("[afdian-webhook] bad signature");
    return NextResponse.json({ ec: 401, em: "bad sign" });
  }

  const orderData = body.data?.order;
  if (!orderData || body.data?.type !== "order") {
    return NextResponse.json({ ec: 200, em: "ignored" });
  }

  // 只处理已支付
  if (orderData.status !== 2) {
    return NextResponse.json({ ec: 200, em: "not paid" });
  }

  // 解析订单信息
  const customOrderId = orderData.custom_order_id || orderData.remark?.trim();
  const afdianPlanId = orderData.plan_id;
  const planId = resolveOurPlanId(afdianPlanId) as PlanId | null;

  if (!customOrderId || !planId || !(planId in PLANS)) {
    console.warn("[afdian-webhook] can't match:", {
      customOrderId,
      afdianPlanId,
      planId,
    });
    // 返回 200 防止爱发电重试
    return NextResponse.json({ ec: 200, em: "unmatched" });
  }

  const admin = createAdminClient();

  // 查找我们的订单
  const { data: order, error: qerr } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("out_trade_no", customOrderId)
    .maybeSingle();

  if (qerr || !order) {
    console.warn("[afdian-webhook] order not found:", customOrderId);
    return NextResponse.json({ ec: 200, em: "order not found" });
  }

  // 幂等：已处理
  if (order.status === "paid") {
    return NextResponse.json({ ec: 200, em: "already paid" });
  }

  const plan = PLANS[planId];

  // 更新订单
  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_order_id: orderData.out_trade_no || null,
      raw: body,
    })
    .eq("id", order.id);

  // 升级 profile
  const { data: profile } = await admin
    .from("profiles")
    .select("plan_expires_at")
    .eq("id", order.user_id)
    .single();

  const now = Date.now();
  let newExpires: string | null = null;
  if (plan.durationDays) {
    const current = profile?.plan_expires_at
      ? new Date(profile.plan_expires_at).getTime()
      : now;
    const base = Math.max(now, current);
    newExpires = new Date(
      base + plan.durationDays * 24 * 3600 * 1000
    ).toISOString();
  }

  await admin
    .from("profiles")
    .update({
      plan: plan.plan,
      plan_expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.user_id);

  console.log(
    "[afdian-webhook] upgraded user:",
    order.user_id,
    "→",
    plan.plan
  );
  return NextResponse.json({ ec: 200, em: "ok" });
}
