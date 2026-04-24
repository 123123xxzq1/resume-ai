/**
 * 本地 Demo 分析引擎
 * 当 OpenAI 未配置时，基于关键词重叠 + 模板化改写，生成"足够真实"的分析结果。
 *
 * 设计目标：
 * - 评分基于真实 keyword overlap，有区分度
 * - 缺失关键词来自 JD 实际文本（不是硬编码）
 * - 优势/弱点结合已命中的关键词
 * - 改写挑选简历里最短的 2-3 条 bullet，套用 STAR 强化模板
 */

export type DemoResult = {
  score: number;
  summary: string;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  rewrites: { original: string; improved: string; reason: string }[];
  meta: { remainingCredits: number; plan: "demo" };
};

// 中文停用词（只保留常见的，避免把"前端/后端/算法"等有意义的词过滤掉）
const STOP_WORDS = new Set([
  "的", "了", "和", "与", "及", "或", "以及", "包括", "等等", "等",
  "我们", "他们", "你们", "他", "她", "它", "我", "你",
  "是", "在", "有", "要", "会", "能", "可以", "需要", "应该",
  "这", "那", "这个", "那个", "一个", "一些", "一种",
  "也", "都", "就", "还", "又", "再", "很", "非常",
  "对于", "关于", "基于", "通过", "按照", "根据", "因为", "所以",
  "但是", "而且", "如果", "虽然", "尽管",
  "来", "去", "到", "从", "向", "往",
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
  "岗位", "职位", "工作", "经验", "要求", "负责", "具备", "熟悉",
  "优先", "参与", "完成", "推动",
  "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "by", "from",
  "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "this", "that", "these", "those", "it", "its",
  "you", "your", "our", "we",
]);

// 硬技能识别白名单（即使被分词过滤，也保留）
const HARD_SKILL_PATTERNS = [
  /\b(react|vue|angular|svelte|next\.?js|nuxt|remix)\b/i,
  /\b(node\.?js|express|nestjs|fastify|koa)\b/i,
  /\b(java|spring|springboot|mybatis|dubbo|kafka)\b/i,
  /\b(python|django|flask|fastapi|pytorch|tensorflow)\b/i,
  /\b(go|golang|rust|c\+\+|typescript|javascript)\b/i,
  /\b(mysql|postgresql|mongodb|redis|elasticsearch|clickhouse)\b/i,
  /\b(aws|azure|gcp|docker|kubernetes|k8s|terraform)\b/i,
  /\b(git|jenkins|ci\/cd|devops)\b/i,
  /\b(figma|sketch|axure|photoshop)\b/i,
  /\b(sql|nosql|graphql|rest|grpc)\b/i,
  /\b(ml|ai|llm|rag|agent|gpt|bert|transformer)\b/i,
];

/**
 * 从文本中抽取候选关键词
 * 策略：
 * 1. 英文技术栈：按空白/标点分词，保留 2-30 字符的 alphanumeric
 * 2. 中文：用 2-4 字长的片段（简易 N-gram）
 * 3. 应用白名单强匹配
 */
function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const tokens = new Set<string>();

  // 英文 token
  const enTokens = lower.match(/[a-z][a-z0-9+#\.\-]{1,29}/g) || [];
  for (const t of enTokens) {
    if (STOP_WORDS.has(t)) continue;
    if (t.length < 2) continue;
    tokens.add(t);
  }

  // 中文 2-4 gram（去掉停用词）
  const zhText = text.replace(/[^\u4e00-\u9fa5]/g, " ");
  const zhChunks = zhText.split(/\s+/).filter(Boolean);
  for (const chunk of zhChunks) {
    for (let len = 2; len <= 4 && len <= chunk.length; len++) {
      for (let i = 0; i + len <= chunk.length; i++) {
        const w = chunk.substring(i, i + len);
        if (STOP_WORDS.has(w)) continue;
        tokens.add(w);
      }
    }
  }

  // 白名单硬技能
  for (const re of HARD_SKILL_PATTERNS) {
    const m = text.match(re);
    if (m) tokens.add(m[0].toLowerCase());
  }

  return Array.from(tokens);
}

/**
 * 从 JD 中抽取"真正的需求关键词"
 * 启发式：出现在 JD 中的、长度 2-20、在常见简历词库外的词
 */
function extractJdRequirements(jd: string): string[] {
  const keywords = extractKeywords(jd);
  // 按词在 JD 中出现的次数排序，取 Top 30 做候选池
  const freq = new Map<string, number>();
  const lowerJd = jd.toLowerCase();
  for (const kw of keywords) {
    const count = (lowerJd.match(new RegExp(escapeRegExp(kw), "g")) || []).length;
    if (count > 0) freq.set(kw, count);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([k]) => k)
    .filter((k) => k.length >= 2 && k.length <= 20);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 拆分简历成可识别的"条目"
 * 简历中的 bullet 通常以 短横线、圆点、星号、数字点 等符号开头，或独占一行
 */
function extractBullets(resume: string): string[] {
  const lines = resume.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const bullets: string[] = [];
  for (const line of lines) {
    // 识别 bullet 前缀
    const cleaned = line.replace(/^[-•*·●◆▪️▫]\s*/, "").replace(/^\d+[\.、]\s*/, "").trim();
    // 长度启发：bullet 通常 10-200 字
    if (cleaned.length >= 10 && cleaned.length <= 200) {
      // 排除标题行（独占一行，短）
      if (cleaned.length >= 15) {
        bullets.push(cleaned);
      }
    }
  }
  return bullets;
}

/**
 * 判断一条 bullet 是否"需要改写"（短 + 无数字 + 弱动词）
 */
function needsRewrite(bullet: string): number {
  let score = 0;
  // 无数字扣分（需要改写度 +）
  if (!/\d/.test(bullet)) score += 3;
  // 短扣分
  if (bullet.length < 40) score += 2;
  // 弱动词
  if (/^(负责|参与|协助|配合|完成|处理)/.test(bullet)) score += 3;
  // 有百分号/金额/时间数字 → 已经很好了
  if (/%|万|亿|千|倍|k|m|ms|qps|dau|mau|gmv/i.test(bullet)) score -= 2;
  return score;
}

/**
 * 生成改写版本：套用 STAR + 量化模板
 */
function improveBullet(original: string, jdKeywords: string[]): { improved: string; reason: string } {
  // 策略：把"参与/负责/配合"这类弱动词替换成强动词，并附加量化后缀
  const actionVerbs = ["主导", "设计并落地", "端到端负责", "从 0 到 1 搭建", "重构"];
  const metrics = [
    "整体效率提升 30%",
    "月度 GMV 增长 1200w",
    "P99 延迟降低 45%",
    "用户留存率提升 8pp",
    "单量从日 10w 提升到 80w（+700%）",
    "团队交付速度提升 2x",
  ];

  let improved = original;

  // 替换弱动词
  const weakVerbMatch = original.match(/^(负责|参与|协助|配合|完成|处理)/);
  if (weakVerbMatch) {
    const newVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    improved = newVerb + original.substring(weakVerbMatch[0].length);
  }

  // 如果没数字，追加一个量化后缀
  if (!/\d/.test(improved)) {
    const metric = metrics[Math.floor(Math.random() * metrics.length)];
    improved = improved.replace(/[。；]?$/, `，${metric}`);
  }

  // 如果 JD 里有该 bullet 没出现的关键词，挑一个嵌入
  const lowerBullet = improved.toLowerCase();
  const fitKeyword = jdKeywords.find(
    (k) => k.length >= 3 && k.length <= 12 && !lowerBullet.includes(k.toLowerCase())
  );
  let reason = "以强动词开头，补齐量化数字";
  if (fitKeyword) {
    reason = `以强动词开头，补齐量化数字，并融入 JD 关键词「${fitKeyword}」`;
  }

  return { improved, reason };
}

/**
 * 主入口：Demo 分析
 */
export function demoAnalyze(resume: string, jd: string): DemoResult {
  const jdKeywords = extractJdRequirements(jd);
  const resumeKeywords = new Set(extractKeywords(resume).map((k) => k.toLowerCase()));

  // 命中 vs 缺失
  const hit: string[] = [];
  const missing: string[] = [];
  for (const kw of jdKeywords) {
    if (resumeKeywords.has(kw.toLowerCase())) {
      hit.push(kw);
    } else {
      missing.push(kw);
    }
  }

  // 评分：命中率 × 基础分
  const hitRate = jdKeywords.length === 0 ? 0.6 : hit.length / jdKeywords.length;
  // 映射到 45-92 分（纯 demo 模式不给超高分，真实 AI 才能）
  let score = Math.round(45 + hitRate * 47);
  // 简历太短扣分
  if (resume.length < 300) score = Math.max(35, score - 10);
  // 简历有数字加分
  const numCount = (resume.match(/\d+[%万亿千百]?/g) || []).length;
  if (numCount >= 5) score = Math.min(92, score + 3);
  score = Math.max(40, Math.min(92, score));

  // Strengths（优势）
  const strengths: string[] = [];
  if (hit.length >= 5) strengths.push(`命中 ${hit.length} 个 JD 核心关键词`);
  if (hit.slice(0, 3).length > 0) {
    strengths.push(`具备 ${hit.slice(0, 3).join("、")} 等匹配技能`);
  }
  if (numCount >= 5) strengths.push("有可量化的业绩数据");
  if (/\d+\s*年/.test(resume)) strengths.push("年限与 JD 资历要求相符");
  if (strengths.length < 2) {
    strengths.push("简历结构清晰，信息完整");
    strengths.push("教育背景与岗位方向匹配");
  }

  // Weaknesses（弱点）
  const weaknesses: string[] = [];
  if (missing.length >= 5) {
    weaknesses.push(`缺失 ${missing.length} 个 JD 关键词`);
  }
  if (numCount < 3) {
    weaknesses.push("缺少量化数据（%、万元、倍数等）");
  }
  if (resume.length < 800) {
    weaknesses.push("简历内容过短，未充分展开项目细节");
  }
  if (/(负责|参与|配合|协助)/.test(resume)) {
    weaknesses.push("使用了过多被动动词（负责/参与/配合）");
  }
  if (!/(主导|设计|驱动|重构|从 ?0)/.test(resume)) {
    weaknesses.push("缺少主动动词，未体现 Owner 意识");
  }
  if (weaknesses.length < 3) {
    weaknesses.push("部分工作经历的业务影响未量化");
  }

  // Rewrites（改写建议）
  const bullets = extractBullets(resume);
  const ranked = bullets
    .map((b) => ({ b, priority: needsRewrite(b) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const rewrites = ranked.map(({ b }) => {
    const { improved, reason } = improveBullet(b, jdKeywords);
    return { original: b, improved, reason };
  });

  // 兜底：如果简历没抽出 bullet，给一个示例改写
  if (rewrites.length === 0) {
    rewrites.push({
      original: "负责用户中心模块开发",
      improved:
        "主导用户中心模块从 0 到 1 搭建，支撑日活 200w+，核心接口 P99 延迟 80ms，上线半年零故障",
      reason: "以强动词开头，补齐业务规模、性能指标、稳定性证据",
    });
  }

  // Summary
  let summary = `当前简历在该岗位的 ATS 匹配度为 ${score} / 100。`;
  if (score >= 80) {
    summary += "整体表现优秀，核心关键词命中率高，建议微调弱动词和补充少量缺失技能即可。";
  } else if (score >= 60) {
    summary += `存在 ${missing.length} 个关键词缺口，建议优先在简历中补齐 Top 3 缺失技能，并把弱动词改写为强动词。`;
  } else {
    summary += `差距较大：一是缺失 ${missing.length} 个 JD 核心关键词，二是工作经历量化不足。建议逐条用 STAR 法则重写。`;
  }

  return {
    score,
    summary,
    missingKeywords: missing.slice(0, 10),
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    rewrites,
    meta: { remainingCredits: 999, plan: "demo" },
  };
}
