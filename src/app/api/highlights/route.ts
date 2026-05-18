import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取精彩回放列表 + 分页
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize")) || 10));
    const offset = (page - 1) * pageSize;

    let whereSql = " WHERE 1=1";
    const params: any[] = [];

    if (type) {
      whereSql += " AND h.type = ?";
      params.push(type);
    }

    // 查总数
    const countResult: any = await query(`SELECT COUNT(*) as total FROM highlights h${whereSql}`, params);
    const total = countResult[0].total;

    // 查分页数据
    const sql = `SELECT h.*, t1.name as home_team_name, t2.name as away_team_name, m.match_date
      FROM highlights h
      LEFT JOIN matches_ m ON h.match_id = m.id
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      ${whereSql}
      ORDER BY h.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;

    const highlights = await query(sql, params);

    return NextResponse.json({
      code: 200,
      data: {
        list: highlights,
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
