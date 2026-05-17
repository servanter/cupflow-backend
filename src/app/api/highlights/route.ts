import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取精彩回放列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let sql = `SELECT h.*, t1.name as home_team_name, t2.name as away_team_name, m.match_date
      FROM highlights h
      LEFT JOIN matches_ m ON h.match_id = m.id
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE 1=1`;
    const params: any[] = [];

    if (type) {
      sql += " AND h.type = ?";
      params.push(type);
    }

    sql += " ORDER BY h.created_at DESC";

    const highlights = await query(sql, params);
    return NextResponse.json({ code: 200, data: highlights });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
