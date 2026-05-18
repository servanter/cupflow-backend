import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取资讯列表，支持按标签筛选 + 分页
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 10));
    const offset = (page - 1) * pageSize;

    let whereSql = " WHERE 1=1";
    const params: any[] = [];

    if (tag) {
      whereSql += " AND tag = ?";
      params.push(tag);
    }

    // 查总数
    const countResult: any = await query(`SELECT COUNT(*) as total FROM football_news${whereSql}`, params);
    const total = countResult[0].total;

    // 查分页数据
    const sql = `SELECT * FROM football_news${whereSql} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
    const news = await query(sql, params);

    return NextResponse.json({
      code: 200,
      data: {
        list: news,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total
      }
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
