import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "服务条款 · ResumeAI",
  description:
    "使用 ResumeAI 前请阅读本服务条款。包含使用规则、退款政策、免责声明等。",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-white">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <header className="mb-10 border-b border-slate-200 pb-6">
            <h1 className="text-4xl font-bold text-slate-900">服务条款</h1>
            <p className="mt-3 text-sm text-slate-500">
              最近更新：2025 年 4 月 · 继续使用即表示你同意这些条款。
            </p>
          </header>

          <div className="prose-custom">
            <h2>1. 服务内容</h2>
            <p>
              ResumeAI 是一个 AI 简历优化工具，提供以下核心能力：
            </p>
            <ul>
              <li>基于 OpenAI 的简历 × JD 匹配度分析</li>
              <li>ATS 筛选模拟与评分</li>
              <li>STAR 法则改写建议</li>
              <li>求职相关知识库内容</li>
            </ul>

            <h2>2. 使用规则</h2>
            <h3>你可以</h3>
            <ul>
              <li>上传自己的简历和目标 JD 进行分析</li>
              <li>将分析结果用于个人求职、优化简历</li>
              <li>订阅会员获得更多分析次数</li>
              <li>通过 API / RSS 消费我们的博客内容（标注来源）</li>
            </ul>

            <h3>你不可以</h3>
            <ul>
              <li>使用爬虫或自动化工具批量请求分析接口</li>
              <li>将账号借给他人或卖给他人</li>
              <li>上传违法、虚假、不属于你本人的简历内容</li>
              <li>通过技术手段绕过免费次数限制</li>
              <li>反向工程或破解我们的提示词 / 算法</li>
            </ul>
            <p>
              违反上述规则，我们有权<strong>立即终止你的账户</strong>，已支付费用不予退还。
            </p>

            <h2>3. 账户</h2>
            <ul>
              <li>
                注册账户时，你需要提供有效的邮箱。如果你提供虚假信息，我们有权终止账户。
              </li>
              <li>
                你自己承担账户密码安全责任。因账号泄露导致的损失，由你自己承担。
              </li>
              <li>
                注销账户可通过发邮件到 hi@resumeai.com 申请，我们会在 7 个工作日内处理。
              </li>
            </ul>

            <h2>4. 付费与退款</h2>
            <h3>付费方式</h3>
            <ul>
              <li>
                海外信用卡：通过 Stripe 处理。订阅模式会自动续费，可随时在 Dashboard 取消。
              </li>
              <li>
                国内微信 / 支付宝：通过易支付处理。单笔购买，到期后不自动续费。
              </li>
            </ul>

            <h3>退款政策</h3>
            <p>
              <strong>7 天无理由退款</strong>：支付后 7 天内，如果你的使用次数 ≤ 2 次，
              可申请全额退款，无需理由。
            </p>
            <p>
              超过 7 天或使用次数 &gt; 2 次，我们<strong>不再接受退款申请</strong>，
              除非服务出现重大故障（我们主动公告的 P0 故障 &gt; 24 小时）。
            </p>

            <h3>价格调整</h3>
            <p>
              我们保留调整价格的权利。任何价格调整仅影响新订单，
              已购买的订阅周期（Pro 月）或终身版权益不受影响。
            </p>

            <h2>5. 知识产权</h2>
            <ul>
              <li>
                <strong>你的简历</strong>：版权永远属于你。我们不获取任何权利。
              </li>
              <li>
                <strong>AI 生成的改写建议</strong>：你可以自由使用于任何用途。
              </li>
              <li>
                <strong>ResumeAI 的品牌、UI、代码、博客文章</strong>：版权归 ResumeAI
                团队所有，未经许可不得复制、转载、二次分发（引用 + 署名除外）。
              </li>
            </ul>

            <h2>6. 免责声明</h2>
            <p>
              <strong>ResumeAI 是一个辅助工具，不是 offer 保证</strong>。
              我们尽力让改写建议符合 ATS 规则和真实招聘场景，但：
            </p>
            <ul>
              <li>
                使用 ResumeAI 不保证你一定能获得 offer。offer 取决于你的真实能力、
                岗位匹配、市场供需等多重因素。
              </li>
              <li>
                AI 生成的内容可能存在事实性错误，你<strong>有责任</strong>在使用前核对。
                不要复制未经核实的"量化数字"到真实简历。
              </li>
              <li>
                我们的博客文章基于公开信息和行业经验，不构成职业咨询或法律意见。
              </li>
            </ul>

            <h2>7. 服务变更与终止</h2>
            <ul>
              <li>
                我们可能会因为技术升级、业务调整而变更或终止部分服务。
                重大变更会提前 30 天通知。
              </li>
              <li>
                如果产品整体停止运营，终身版用户会按剩余月份比例获得退款。
              </li>
            </ul>

            <h2>8. 适用法律</h2>
            <p>
              本条款适用中国大陆法律。如发生争议，应协商解决；
              协商不成，提交中国大陆有管辖权的人民法院诉讼解决。
            </p>

            <h2>9. 联系我们</h2>
            <p>
              有任何条款相关问题，请邮件：<strong>hi@resumeai.com</strong>。
            </p>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
