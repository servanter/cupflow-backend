import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取资讯详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rows = await query("SELECT * FROM football_news WHERE id = ?", [params.id]);

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ code: 404, message: "资讯不存在" }, { status: 404 });
    }

    return NextResponse.json({ code: 200, data: (rows as any[])[0] });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
