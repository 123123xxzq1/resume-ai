// 用爱发电 API 查询所有赞助方案，列出 plan_id
// 用法（PowerShell）:
//   $env:AFDIAN_USER_ID="xxx"; $env:AFDIAN_TOKEN="xxx"; node scripts/afdian-query-plans.mjs

import crypto from "node:crypto";

const userId = process.env.AFDIAN_USER_ID;
const token = process.env.AFDIAN_TOKEN;

if (!userId || !token) {
  console.error("❌ 请先设置 AFDIAN_USER_ID 和 AFDIAN_TOKEN 环境变量");
  process.exit(1);
}

// AfDian 要求 params 是 JSON 字符串
const params = JSON.stringify({ page: 1 });
const ts = Math.floor(Date.now() / 1000);

// 签名: md5(KEY + "params" + params + "ts" + ts + "user_id" + user_id)
//   其中 KEY 就是 token
const signStr = `${token}params${params}ts${ts}user_id${userId}`;
const sign = crypto.createHash("md5").update(signStr).digest("hex");

const body = {
  user_id: userId,
  params,
  ts,
  sign,
};

console.log("🔄 请求爱发电 API...");
console.log("   URL:    https://afdian.com/api/open/query-plan");
console.log("   ts:     " + ts);
console.log("   sign:   " + sign);
console.log();

// 同时尝试 JSON 和 form-urlencoded 两种 body 格式，看哪种能用
async function tryRequest(useForm) {
  const headers = useForm
    ? { "Content-Type": "application/x-www-form-urlencoded" }
    : { "Content-Type": "application/json" };
  const reqBody = useForm
    ? new URLSearchParams(body).toString()
    : JSON.stringify(body);
  const res = await fetch("https://afdian.com/api/open/query-plan", {
    method: "POST",
    headers,
    body: reqBody,
  });
  const txt = await res.text();
  console.log(`\n[${useForm ? "form" : "json"}] HTTP ${res.status}: ${txt.slice(0, 300)}`);
  try {
    return JSON.parse(txt);
  } catch {
    return { _raw: txt };
  }
}

try {
  let data = await tryRequest(false);
  if (data.ec !== 200) {
    console.log("\n→ JSON 失败，改试 form-urlencoded...");
    data = await tryRequest(true);
  }

  if (data.ec !== 200) {
    console.error("❌ API 返回失败:", data);
    process.exit(2);
  }

  const list = data.data?.list || [];
  if (list.length === 0) {
    console.log("⚠️ 还没有任何赞助方案，请先去爱发电创建。");
    process.exit(0);
  }

  console.log(`✅ 共找到 ${list.length} 个方案:\n`);
  console.log("─".repeat(80));
  for (const plan of list) {
    console.log("  方案名称:  " + (plan.name || "(无名)"));
    console.log("  plan_id:   " + plan.plan_id);
    console.log("  价格:      ¥" + plan.price);
    console.log("  状态:      " + (plan.status === 1 ? "✅ 上架" : "⛔ 下架"));
    console.log("  描述:      " + (plan.desc || "").slice(0, 60));
    console.log("─".repeat(80));
  }

  console.log("\n📋 复制下面这两行到 Vercel 环境变量:\n");
  for (const plan of list) {
    if (plan.price === "9.90" || plan.price === "9.9") {
      console.log("AFDIAN_PLAN_PRO_MONTHLY=" + plan.plan_id);
    }
    if (plan.price === "96.00" || plan.price === "96") {
      console.log("AFDIAN_PLAN_PRO_YEARLY=" + plan.plan_id);
    }
  }
} catch (e) {
  console.error("❌ 请求出错:", e.message);
  process.exit(3);
}
