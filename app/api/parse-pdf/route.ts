import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "未上传文件" }, { status: 400 });
    }

    const maxBytes = 6 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: "文件过大，请压缩到 6MB 以内" },
        { status: 413 }
      );
    }

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(ab);

    // 动态 import 避免 Next 打包阶段抱怨
    const pdfParseMod: any = await import("pdf-parse");
    const pdfParse = pdfParseMod.default || pdfParseMod;
    const data = await pdfParse(buf);
    const text = (data?.text || "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "未能从 PDF 中提取出文字，可能是扫描件，请手动粘贴简历内容" },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("[parse-pdf] error:", e);
    return NextResponse.json(
      { error: e?.message || "PDF 解析失败" },
      { status: 500 }
    );
  }
}
