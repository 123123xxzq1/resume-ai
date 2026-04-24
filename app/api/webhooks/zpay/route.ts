import { NextResponse } from "next/server";
import { verifyZPaySign } from "@/lib/payments/zpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, type PlanId } from "@/lib/payments/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ZPay 异步通知默认是 GET（有些服务商是 POST，两个都支持）
export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}

async function handle(req: Request) {
  const key = process.env.ZPAY_KEY;
  if (!key) {
    console.error("[zpay-webhook] ZPAY_KEY 未配置");
    return new NextResponse("fail", { status: 500 });
  }

  const url = new URL(req.url);
  let paramsObj: Record<string, string> = {};
  paramsObj = Object.fromEntries(url.searchParams.entries());

  // 兼容 POST form-urlencoded
  if (req.method === "POST") {
    try {
      const ctype = req.headers.get("content-type") || "";
      if (ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data")) {
        const form = await req.formData();
        form.forEach((v, k) => {
          if (typeof v === "string") paramsObj[k] = v;
        });
      } else if (ctype.includes("application/json")) {
        const j = await req.json();
        Object.assign(paramsObj, j);
      }
    } catch {
      /* ignore */
    }
  }

  const sign = paramsObj.sign || "";
  if (!verifyZPaySign(paramsObj, sign, key)) {
    console.warn("[zpay-webhook] bad signature", paramsObj);
    return new NextResponse("fail", { status: 400 });
  }

  const tradeStatus = paramsObj.trade_status;
  if (tradeStatus !== "TRADE_SUCCESS") {
    // 未成功就只回应 ok
    return new NextResponse("success");
  }

  const outTradeNo = paramsObj.out_trade_no;
  const planId = paramsObj.param as PlanId | undefined;
  if (!outTradeNo || !planId || !(planId in PLANS)) {
    console.warn("[zpay-webhook] missing fields:", paramsObj);
    return new NextResponse("fail", { status: 400 });
  }

  const admin = createAdminClient();

  // 找到订单
  const { data: order, error: qerr } = await admin
    .from("orders")
    .select("id, user_id, status")
    .eq("out_trade_no", outTradeNo)
    .maybeSingle();

  if (qerr || !order) {
    console.warn("[zpay-webhook] order not found:", outTradeNo);
    return new NextResponse("fail", { status: 404 });
  }

  if (order.status === "paid") {
    // 幂等：已处理
    return new NextResponse("success");
  }

  const plan = PLANS[planId];

  // 更新订单
  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      provider_order_id: paramsObj.trade_no || null,
      raw: paramsObj,
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

  // ZPay 协议要求返回纯文本 "success"
  return new NextResponse("success");
}
