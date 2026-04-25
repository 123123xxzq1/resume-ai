// 从主页 HTML 找出所有 API endpoint 和 JS bundle，再 grep JS bundle 里的 plan API
import fs from "node:fs";

const html = fs.readFileSync("scripts/afdian-page.html", "utf8");

// 1. 提取 HTML 里的 API 路径
const apis = [...new Set(html.match(/\/api\/[a-z/_-]+/gi) || [])];
console.log("📌 HTML 里出现的 API 路径:");
apis.forEach((a) => console.log("  " + a));

// 2. 提取 script 标签的 JS bundle URL
const scriptMatches = html.match(/<script[^>]+src=["']([^"']+)["']/gi) || [];
const scripts = scriptMatches
  .map((s) => s.match(/src=["']([^"']+)["']/)?.[1])
  .filter(Boolean);
console.log("\n📜 JS bundle URLs:");
scripts.slice(0, 10).forEach((s) => console.log("  " + s));

// 3. 取头几个 JS bundle，下载 grep 里面 API 调用
const fullUrls = scripts
  .filter((s) => s.endsWith(".js") || s.includes(".js"))
  .map((s) => (s.startsWith("http") ? s : "https://afdian.com" + s));

const allApis = new Set();
console.log("\n🔍 下载 JS bundle 找 API 调用...");
for (const url of fullUrls.slice(0, 5)) {
  try {
    const res = await fetch(url);
    const code = await res.text();
    console.log(`  ${url} (${code.length} bytes)`);
    const apiCalls = code.match(/["']\/api\/[a-z/_-]+["']/g) || [];
    apiCalls.forEach((a) => allApis.add(a.replace(/["']/g, "")));
  } catch (e) {
    console.log(`  ⛔ ${url}: ${e.message}`);
  }
}
console.log("\n✅ JS bundle 里发现的 API 调用:");
[...allApis].sort().forEach((a) => console.log("  " + a));

// 4. 重点过滤 plan / creator 相关
console.log("\n🎯 plan / creator 相关 API:");
[...allApis]
  .filter((a) => /plan|creator|sponsor|user/i.test(a))
  .forEach((a) => console.log("  " + a));
