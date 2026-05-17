import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

// 发布直播消息
export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const { match_id, time, type, content } = await request.json();

    if (!match_id || !time || !content) {
      return NextResponse.json({ code: 400, message: "请填写完整信息" }, { status: 400 });
    }

    await execute(
      "INSERT INTO live_messages (match_id, time, type, content) VALUES (?, ?, ?, ?)",
      [match_id, time, type || "普通", content]
    );

    return NextResponse.json({ code: 200, message: "发布成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
