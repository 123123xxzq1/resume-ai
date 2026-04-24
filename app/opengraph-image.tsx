import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ResumeAI — 用 AI 30 秒把简历打磨到 HR 眼前一亮";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
        }}
      >
        {/* Top: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            ✨
          </div>
          <div style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            ResumeAI
          </div>
        </div>

        {/* Middle: Tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "22px",
              opacity: 0.85,
            }}
          >
            <span
              style={{
                padding: "6px 14px",
                background: "rgba(255, 255, 255, 0.18)",
                borderRadius: "999px",
                fontWeight: 500,
              }}
            >
              GPT-4o 驱动
            </span>
            <span>·</span>
            <span>13 篇深度求职指南</span>
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              maxWidth: "960px",
            }}
          >
            让你的简历在
            <br />
            <span style={{ color: "#fde68a" }}>7 秒 ATS 筛选</span>
            中活下来
          </div>
        </div>

        {/* Bottom: Bullet features */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            fontSize: "24px",
            opacity: 0.9,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#fde68a" }}>●</span>
            <span>ATS 匹配度评分</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#fde68a" }}>●</span>
            <span>缺失关键词检测</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#fde68a" }}>●</span>
            <span>STAR 法则改写</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
