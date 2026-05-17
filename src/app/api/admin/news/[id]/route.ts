import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const { title, tag, cover_url, video_url, summary, content } = await request.json();

    await execute(
      "UPDATE football_news SET title=?, tag=?, cover_url=?, video_url=?, summary=?, content=? WHERE id=?",
      [title, tag, cover_url, video_url, summary, content, params.id]
    );

    return NextResponse.json({ code: 200, message: "更新成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    await execute("DELETE FROM football_news WHERE id = ?", [params.id]);
    return NextResponse.json({ code: 200, message: "删除成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
