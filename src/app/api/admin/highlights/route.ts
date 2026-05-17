import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const { match_id, title, type, occur_time, description, video_url } = await request.json();

    await execute(
      "INSERT INTO highlights (match_id, title, type, occur_time, description, video_url) VALUES (?, ?, ?, ?, ?, ?)",
      [match_id, title, type, occur_time, description || null, video_url]
    );

    return NextResponse.json({ code: 200, message: "添加成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
