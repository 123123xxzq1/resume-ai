// 调爱发电公开 API 抓 profile 和 plans
const userId = process.env.AFDIAN_USER_ID;
if (!userId) {
  console.error("❌ 需要 AFDIAN_USER_ID");
  process.exit(1);
}

const endpoints = [
  `https://afdian.com/api/user/get-profile?user_id=${userId}`,
  `https://afdian.com/api/creator/get-plans?user_id=${userId}`,
  `https://afdian.com/api/creator/all-plans?user_id=${userId}`,
];

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Referer": `https://afdian.com/u/${userId}`,
};

for (const url of endpoints) {
  console.log("\n→ " + url);
  try {
    const res = await fetch(url, { headers });
    const txt = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(txt);
    } catch {
      console.log("  (非 JSON, 前 200 字符:) " + txt.slice(0, 200));
      continue;
    }
    console.log("  HTTP " + res.status + ", ec=" + parsed.ec + ", em=" + parsed.em);
    if (parsed.ec === 200 && parsed.data) {
      // 写入文件方便看
      const fs = await import("node:fs");
      const fname = "scripts/afdian-" + url.split("/").pop().split("?")[0] + ".json";
      fs.writeFileSync(fname, JSON.stringify(parsed, null, 2));
      console.log("  ✅ 完整数据已写入 " + fname);
      // 提取 plan 信息
      const plans =
        parsed.data?.plan_list ||
        parsed.data?.plans ||
        parsed.data?.list ||
        (Array.isArray(parsed.data) ? parsed.data : []);
      if (plans?.length) {
        console.log("\n  🎯 找到 " + plans.length + " 个方案:");
        plans.forEach((p, i) => {
          console.log(
            `    [${i}] name="${p.name || p.title || "?"}" price=${p.price || p.show_price || "?"} plan_id=${p.plan_id || p.id || "?"}`
          );
        });
      }
    }
  } catch (e) {
    console.log("  ⛔ " + e.message);
  }
}
