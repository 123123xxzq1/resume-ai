# ResumeAI — AI 简历优化器

> 一句话：用户粘贴简历 + 目标岗位 JD，30 秒拿到 ATS 匹配度评分、缺失关键词、逐条 STAR 式改写建议。

这是一个**可以直接跑起来并上线挣钱**的独立开发者 SaaS MVP。

![cover](./.github/cover.png)

## 为什么这个项目能挣钱？

1. **刚需且高频**：每年毕业生 + 跳槽者 = 上亿人需要，投一份简历改一次。
2. **付费意愿强**：相比 offer 涨薪 2000~20000/月，花几十块改简历的 ROI 显而易见。
3. **成本极低**：单次分析调用 GPT-4o-mini 约 ¥0.02，定价 ¥39/月无限次仍有 95%+ 毛利。
4. **SEO 流量天然好做**：关键词"简历优化 / 简历修改 / ATS"搜索量稳定，竞争对手产品体验普遍糟糕。
5. **可扩展**：简历 → 求职信 → LinkedIn 档案 → 模拟面试 → 职业规划，整条付费链可延伸。

## 技术栈

- **Next.js 14** (App Router) + TypeScript
- **TailwindCSS** + Lucide Icons（无额外 UI 库依赖，打包体积小）
- **OpenAI SDK**（兼容 DeepSeek / Moonshot / 自建代理）
- **pdf-parse** 本地 PDF 文本提取
- **Supabase** 用户系统 + Postgres + RLS
- **Stripe** 海外订阅 + 一次性支付
- **ZPay / 易支付协议** 国内微信 / 支付宝代收（兼容多家）

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 OpenAI Key：

```env
OPENAI_API_KEY=sk-...

# 可选：走国内代理 / 用 DeepSeek
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# OPENAI_MODEL=deepseek-chat
```

> 💡 **省钱技巧**：把 `OPENAI_MODEL` 设为 `deepseek-chat`，`OPENAI_BASE_URL` 设为 `https://api.deepseek.com/v1`，单次成本可降到 ¥0.005 以内。

### 3. 启动

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

> 🌱 **最小可运行**：只填 `OPENAI_API_KEY` 就能跑起来博客 + 落地页（方便先上线做 SEO）。
> 完整用户 + 支付功能需要额外配置 Supabase / Stripe / ZPay，见下文。

## 用户系统：Supabase 配置

ResumeAI 使用 Supabase 做认证 + Postgres + RLS，5 分钟即可接入。

### 1. 创建 Supabase 项目

1. 打开 [https://app.supabase.com](https://app.supabase.com)，注册并新建项目（选离用户最近的区域）
2. 进入 **Settings → API**，复制：
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` **（保密，仅服务端）**

### 2. 跑数据库迁移

1. 在 Supabase Dashboard 左侧 **SQL Editor → New query**
2. 把仓库里的 `supabase/schema.sql` 全部粘贴进去 → **Run**
3. 成功后会创建：`profiles` / `analyses` / `orders` 三张表 + RLS 策略 + `consume_credit` 原子扣费 RPC + 注册后自动建 profile 的 trigger

### 3. （可选）开启 Google OAuth

Supabase Dashboard → **Authentication → Providers → Google**，按指引填写 Google Cloud Console 的 client id/secret 即可让用户用 Google 一键登录。

### 4. 设置回调 URL

Supabase **Authentication → URL Configuration**：

- Site URL：`https://你的域名.com`（本地：`http://localhost:3000`）
- Redirect URLs：`https://你的域名.com/auth/callback`

填完环境变量后重启 `npm run dev`，访问 `/sign-up` 注册账号，会自动创建 profile 并送 3 次免费额度。

## 支付：双通道配置

两条通道独立可用，都不配也能跑（Pricing 页会显示占位）。

### Stripe（海外）

1. 打开 [https://dashboard.stripe.com](https://dashboard.stripe.com) 注册
2. **Developers → API keys**：拷 `Secret key` 和 `Publishable key`
3. **Products** 新建 2 个产品：
   - **Pro Monthly**：循环订阅，$5.9/月
   - **Lifetime**：一次性付费，$39
   - 记下两个 Price ID（`price_xxx`）填入 env
4. **Developers → Webhooks → Add endpoint**：
   - URL：`https://你的域名.com/api/webhooks/stripe`
   - 勾选事件：`checkout.session.completed`、`invoice.paid`
   - 创建后复制 `Signing secret` 填入 `STRIPE_WEBHOOK_SECRET`
5. 本地调试可用 [Stripe CLI](https://stripe.com/docs/stripe-cli) `stripe listen --forward-to localhost:3000/api/webhooks/stripe` 获取 `whsec_xxx`

### ZPay / 易支付（国内微信/支付宝）

本系统使用**易支付协议**（MD5 签名），兼容 ZPay、彩虹易支付、码支付等多家代收平台。

1. 注册任一支持的代收平台（如 [z-pay.cn](https://z-pay.cn)）完成商户实名
2. 获取：
   - `商户 ID` → `ZPAY_PID`
   - `商户密钥` → `ZPAY_KEY`
   - 对方的网关地址 → `ZPAY_GATEWAY`（默认 `https://z-pay.cn`）
3. 在代收平台后台填写**异步通知 URL**：`https://你的域名.com/api/webhooks/zpay`
4. 填写**同步跳转 URL**：`https://你的域名.com/dashboard?paid=1`

#### 签名算法（供自查）

```
待签串 = 按 key ASCII 升序 + "k=v&k=v..." + ZPAY_KEY
sign = md5(待签串).toLowerCase()
```

`lib/payments/zpay.ts` 的 `zpaySign / verifyZPaySign` 已实现，可直接 `node -e` 单测。

## 部署（一键上线）

### Vercel（推荐）

1. `git push` 到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 添加环境变量 `OPENAI_API_KEY`
4. Deploy — 完成，自带 HTTPS 和 CDN

### Netlify / Cloudflare Pages

同理，都支持 Next.js App Router。

## 项目结构

```
.
├── app/
│   ├── layout.tsx                       # 根布局 + 全局 metadata / OG / robots
│   ├── page.tsx                         # Landing 落地页
│   ├── globals.css                      # Tailwind + prose 样式
│   ├── sitemap.ts / robots.ts / feed.xml   # SEO 基础设施
│   ├── (auth)/                          # ⭐ 认证页面组（不带路径前缀）
│   │   ├── sign-in/page.tsx             # 登录（邮箱+密码 + Google OAuth）
│   │   └── sign-up/page.tsx             # 注册（自动送 3 次免费额度）
│   ├── auth/
│   │   ├── callback/route.ts            # OAuth/邮箱验证回调
│   │   └── signout/route.ts             # 退出登录（POST）
│   ├── analyze/
│   │   ├── page.tsx                     # Server wrapper (验证登录/额度)
│   │   └── AnalyzeClient.tsx            # 交互表单 + 结果渲染
│   ├── dashboard/
│   │   └── page.tsx                     # ⭐ 用户中心（套餐/额度/历史/订单）
│   ├── pricing/
│   │   ├── page.tsx                     # ⭐ 定价页（双支付通道）
│   │   └── PricingCard.tsx              # 单卡片组件（客户端下单）
│   ├── blog/                            # SEO 博客子系统（见下文）
│   └── api/
│       ├── analyze/route.ts             # 分析 API + 认证 + 原子扣额度
│       ├── parse-pdf/route.ts
│       ├── checkout/route.ts            # ⭐ 统一下单（stripe/zpay 分发）
│       └── webhooks/
│           ├── stripe/route.ts          # ⭐ Stripe 签名校验 + 订单升级
│           └── zpay/route.ts            # ⭐ ZPay 易支付 notify 验签
├── components/
│   ├── SiteNav.tsx                      # 导航（async，根据登录态切换）
│   ├── UserMenu.tsx                     # 头像 dropdown 菜单
│   ├── SiteFooter.tsx
│   └── BlogSearch.tsx
├── content/posts/                       # Markdown 博文
├── lib/
│   ├── supabase/                        # ⭐
│   │   ├── client.ts                    # 浏览器 client
│   │   ├── server.ts                    # Server Component client
│   │   └── admin.ts                     # service_role（webhook 用）
│   ├── payments/                        # ⭐
│   │   ├── plans.ts                     # 套餐定义（价格/时长/特性）
│   │   ├── types.ts                     # PaymentProvider 接口
│   │   ├── stripe.ts                    # Stripe Provider 实现
│   │   └── zpay.ts                      # ZPay 易支付 Provider + 签名算法
│   ├── blog.ts
│   └── site.ts
├── middleware.ts                        # ⭐ Session 刷新 + /dashboard 保护
├── supabase/
│   └── schema.sql                       # ⭐ 建表 + RLS + RPC + Trigger
├── next.config.js / tailwind.config.ts / tsconfig.json / package.json
```

## 博客子系统使用指南

### 发布一篇新文章

1. 在 `content/posts/` 下新建 `your-slug.md`
2. 顶部加 frontmatter：

```yaml
---
slug: your-slug                   # URL 路径，/blog/your-slug
title: "文章标题"
description: "120 字以内的摘要，会作为 meta description 和分享卡片"
date: "2025-04-10"                # 发布日期
updated: "2025-04-15"             # 可选，最后更新日
category: "职场干货"              # 分类，自动生成 /blog/category/xxx
tags: ["ATS", "求职"]             # 标签，自动生成 /blog/tag/xxx
author: "ResumeAI 团队"           # 可选
---

这里开始写正文，支持完整 GFM Markdown（表格、任务列表、代码块）。
```

3. 提交 git → 自动被 sitemap、索引页、分类页、RSS 收录，**无需改任何代码**。

### 文章里插入产品 CTA

直接在 Markdown 里写：

```markdown
> **👉 [用 ResumeAI 免费测试](/analyze)**，前 3 次完全免费。
```

文章正文底部也有全局固定的渐变 CTA 卡片，每篇文章都会自动出现。

### SEO 能力清单（已实现）

- ✅ 每篇文章独立的 `<title>` / `description` / `canonical` / OpenGraph / Twitter Card
- ✅ Article **JSON-LD** 结构化数据（让 Google 理解这是文章）
- ✅ Breadcrumb **JSON-LD** 结构化数据（搜索结果里显示面包屑）
- ✅ 动态 `sitemap.xml`（主站 + 所有文章 + 分类页 + 标签页，按优先级排序）
- ✅ `robots.txt`（允许全站收录，屏蔽 `/api/`）
- ✅ **RSS Feed** `/feed.xml`（被聚合器和 Google News 抓取）
- ✅ 服务端静态渲染，TTFB < 200ms，Lighthouse SEO 100 分
- ✅ 每篇文章自动生成可锚定的 TOC（Google rich result 可展示"跳转章节"）
- ✅ 相关文章算法（分类权重 3 + 共同标签权重 1）提高站内停留
- ✅ 客户端实时搜索 + 关键词高亮（提升 UX 和人均页面数）

## 变现路线图

### 阶段 1：MVP（已完成，当前版本）
- [x] 核心功能：ATS 评分 + 关键词 + STAR 改写
- [x] 3 次免费试用（localStorage）
- [x] Landing page + Pricing

### 阶段 2：SEO 免费流量（已完成博客基础设施）
- [x] 完整 SEO 博客子系统（`/blog`，见上文"博客子系统"章节）
- [x] 3 篇种子文章（ATS / 关键词 / STAR 法则）
- [x] sitemap / robots / RSS / JSON-LD 结构化数据
- [ ] **持续产出**：每周 1-2 篇 SEO 文章，3 个月积累 30+ 篇可形成 DR 防线
- [ ] 提交 Google Search Console + 必应站长 + 百度站长
- [ ] 知乎 / 小红书 / 脉脉 做外链（锚文本指向 `/blog` 长尾词）

### 阶段 3：付费转化（已完成基础设施 ✅）
- [x] **Supabase** 用户系统：注册/登录/OAuth/RLS/原子扣额度 RPC
- [x] **Stripe** 订阅 + Webhook（checkout.session.completed / invoice.paid）
- [x] **ZPay / 易支付** 国内微信/支付宝代收 + MD5 签名验证
- [x] `/dashboard` 用户中心：套餐 / 额度 / 历史 / 订单
- [x] `/pricing` 定价页双通道下单
- [ ] 填入生产环境的 Supabase/Stripe/ZPay 凭据 → 真实支付联调
- [ ] 接入 Google Analytics + Plausible 追踪"博客→分析页→下单"漏斗

### 阶段 4：增长（预计 1 月）
- [ ] 小红书 / 知乎引流（真实改简历前后对比 case）
- [ ] B 端：对接大学生就业中心、职业规划博主分销
- [ ] 模板市场：30 个 ATS 友好模板，¥9.9/个，长尾流水
- [ ] 扩展功能：求职信生成、LinkedIn 优化、模拟面试（语音）

### 阶段 5：护城河
- [ ] 行业细分版（程序员版 / 设计师版 / 金融版），溢价 30%
- [ ] 企业版：HR 批量筛选打分，B 端付费 10 倍于 C 端

## 数据模型（见 `supabase/schema.sql`）

```ts
profiles  { id, email, plan: free|pro|lifetime, plan_expires_at,
            credits, total_analyses, created_at, updated_at }

analyses  { id, user_id, resume_preview, jd_preview, score,
            model, tokens_used, created_at }

orders    { id, user_id, channel: stripe|zpay, out_trade_no,
            provider_order_id, plan, amount_cents, currency,
            status: pending|paid|failed|refunded, raw, paid_at }

-- 原子扣积分 RPC
select * from consume_credit(p_user_id := auth.uid());
-- 返回 (ok boolean, remaining int, plan text)
-- pro/lifetime 在有效期内直接过；free 用户每次扣 1，用尽返回 ok=false
```

## 成本 & 利润测算

| 项                | 金额              |
| ----------------- | ----------------- |
| OpenAI (4o-mini)  | ¥0.02 / 次        |
| Vercel 带宽       | 免费额度内        |
| 域名              | ¥55 / 年          |
| **单用户月均调用** | ~10 次 = ¥0.2     |
| **定价**          | ¥39 / 月          |
| **毛利率**        | **~99%**          |

每卖出 **100 个月付会员** 即 ¥3900/月，覆盖所有成本还净赚 ¥3850。

## License

MIT — 随便用，赚到钱记得回来点个 star。
