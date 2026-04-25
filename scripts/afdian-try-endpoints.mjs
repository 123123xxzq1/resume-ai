// 探测可用的 list-plan API 端点
import crypto from "node:crypto";

const userId = process.env.AFDIAN_USER_ID;
const token = process.env.AFDIAN_TOKEN;
if (!userId || !token) {
  console.error("❌ 需要 AFDIAN_USER_ID 和 AFDIAN_TOKEN");
  process.exit(1);
}

const endpoints = [
  // 公开 API
  { url: "https://afdian.com/api/user/get-profile-by-id", body: { user_id: userId } },
  { url: "https://afdian.com/api/creator/get-plan-list", body: { user_id: userId } },
  { url: `https://afdian.com/api/user/get-creator?user_id=${userId}`, body: null, method: "GET" },
  { url: `https://afdian.com/api/creator/get-info?user_id=${userId}`, body: null, method: "GET" },
];

async function tryEndpoint(ep) {
  console.log("\n→ " + (ep.method || "POST") + " " + ep.url);
  try {
    const init = {
      method: ep.method || "POST",
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json",
      },
    };
    if (ep.body) init.body = JSON.stringify(ep.body);
    const res = await fetch(ep.url, init);
    const txt = await res.text();
    const preview = txt.slice(0, 400);
    console.log("  HTTP " + res.status + ": " + preview);
    if (res.ok && txt.includes("plan")) {
      console.log("  💡 可能有用，全部内容已写入 scripts/afdian-resp.json");
      const fs = await import("node:fs");
      fs.writeFileSync("scripts/afdian-resp.json", txt);
    }
  } catch (e) {
    console.log("  ⛔ " + e.message);
  }
}

for (const ep of endpoints) {
  await tryEndpoint(ep);
}

// 同时试 query-order，如果有订单就能拿到 plan_id
console.log("\n\n--- 试 query-order (已有订单的话能看到 plan_id) ---");
const params = JSON.stringify({ page: 1 });
const ts = Math.floor(Date.now() / 1000);
const sign = crypto.createHash("md5").update(`${token}params${params}ts${ts}user_id${userId}`).digest("hex");
const body = { user_id: userId, params, ts, sign };
const r = await fetch("https://afdian.com/api/open/query-order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const txt = await r.text();
console.log(txt.slice(0, 800));
