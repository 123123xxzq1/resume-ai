// 抓爱发电创作者主页 HTML，解析 plan_id
// 用法: $env:AFDIAN_USER_ID="xxx"; node scripts/afdian-scrape-plans.mjs

const userId = process.env.AFDIAN_USER_ID;
if (!userId) {
  console.error("❌ 请设置 AFDIAN_USER_ID");
  process.exit(1);
}

// 爱发电公开主页可用 user_id 直访
const candidates = [
  `https://afdian.com/u/${userId}`,
  `https://afdian.com/a/${userId}`,
  `https://afdian.net/u/${userId}`,
  `https://afdian.net/a/${userId}`,
];

async function tryFetch(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html, finalUrl: res.url };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

console.log("🔍 尝试访问爱发电主页...\n");

let html = "";
let foundUrl = "";
for (const url of candidates) {
  console.log("  → " + url);
  const r = await tryFetch(url);
  if (r.ok && r.html?.length > 1000) {
    console.log("    ✅ 成功 (HTTP " + r.status + ", final: " + r.finalUrl + ", " + r.html.length + " bytes)");
    html = r.html;
    foundUrl = r.finalUrl;
    break;
  } else {
    console.log("    ⛔ " + (r.status || r.error));
  }
}

if (!html) {
  console.error("\n❌ 所有 URL 都打不开");
  process.exit(2);
}

console.log("\n📄 找到主页: " + foundUrl);

// 解析 plan_id
const planIds = new Set();

// 模式 1: plan_id="xxx" 或 plan_id: "xxx"
const re1 = /plan[_-]?id["'\s:=]+["']([a-f0-9]{20,})["']/gi;
let m;
while ((m = re1.exec(html)) !== null) planIds.add(m[1]);

// 模式 2: data-plan-id="xxx"
const re2 = /data-plan[_-]?id\s*=\s*["']([a-f0-9]{20,})["']/gi;
while ((m = re2.exec(html)) !== null) planIds.add(m[1]);

// 模式 3: /plan/[planid] 链接
const re3 = /\/plan\/([a-f0-9]{20,})/gi;
while ((m = re3.exec(html)) !== null) planIds.add(m[1]);

// 模式 4: 任何看似 plan_id 的 hash
const re4 = /["']plan_id["']:\s*["']([a-f0-9A-Z]{16,})["']/gi;
while ((m = re4.exec(html)) !== null) planIds.add(m[1]);

console.log("\n🎯 提取到的 plan_id (" + planIds.size + " 个):");
for (const id of planIds) {
  console.log("  • " + id);
}

if (planIds.size === 0) {
  console.log("\n⚠️ 没找到 plan_id。把 HTML 保存下来人工看：scripts/afdian-page.html");
  const fs = await import("node:fs");
  fs.writeFileSync("scripts/afdian-page.html", html);
} else {
  // 同时输出方案名旁的关键词以便辨认
  console.log("\n💡 提示：如果有多个，可以在浏览器打开主页对照价格 ¥9.9 / ¥96 选对应的：");
  console.log("   " + foundUrl);
}
