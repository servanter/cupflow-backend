import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const { title, tag, cover_url, video_url, summary, content } = await request.json();

    await execute(
      "INSERT INTO football_news (title, tag, cover_url, video_url, summary, content) VALUES (?, ?, ?, ?, ?, ?)",
      [title, tag, cover_url || null, video_url || null, summary || null, content || null]
    );

    return NextResponse.json({ code: 200, message: "添加成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
