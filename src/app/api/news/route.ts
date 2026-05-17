import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取资讯列表，支持按标签筛选
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");

    let sql = "SELECT * FROM football_news WHERE 1=1";
    const params: any[] = [];

    if (tag) {
      sql += " AND tag = ?";
      params.push(tag);
    }

    sql += " ORDER BY created_at DESC";

    const news = await query(sql, params);
    return NextResponse.json({ code: 200, data: news });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
