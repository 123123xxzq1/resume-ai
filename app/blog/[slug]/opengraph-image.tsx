import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";

export const alt = "ResumeAI 博客";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  const title = post?.title || "ResumeAI 博客";
  const category = post?.category || "";
  const readingMinutes = post?.readingMinutes || null;

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
          background: "#0f172a",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(124, 58, 237, 0) 70%)",
          }}
        />

        {/* Top: Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            ✨
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: 700 }}>ResumeAI</div>
            <div style={{ fontSize: "16px", opacity: 0.6 }}>
              求职知识库
            </div>
          </div>
        </div>

        {/* Middle: Category + Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            position: "relative",
          }}
        >
          {category && (
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "22px",
              }}
            >
              <span
                style={{
                  padding: "8px 18px",
                  background: "rgba(124, 58, 237, 0.25)",
                  border: "1px solid rgba(124, 58, 237, 0.5)",
                  borderRadius: "999px",
                  color: "#c4b5fd",
                  fontWeight: 500,
                }}
              >
                {category}
              </span>
              {readingMinutes && (
                <span
                  style={{
                    padding: "8px 18px",
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "999px",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 500,
                  }}
                >
                  {readingMinutes} 分钟阅读
                </span>
              )}
            </div>
          )}

          <div
            style={{
              fontSize: title.length > 30 ? "56px" : "64px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              maxWidth: "1040px",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "20px",
            opacity: 0.55,
            position: "relative",
          }}
        >
          <div>resume-ai-liart-six.vercel.app</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#fde68a",
            }}
          >
            <span>阅读全文 →</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
