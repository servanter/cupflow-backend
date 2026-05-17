import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取赛事列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const date = searchParams.get("date");

    let sql = `SELECT m.*, t1.name as home_team_name, t1.flag_url as home_flag,
      t2.name as away_team_name, t2.flag_url as away_flag
      FROM matches_ m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      sql += " AND m.status = ?";
      params.push(status);
    }
    if (stage) {
      sql += " AND m.stage = ?";
      params.push(stage);
    }
    if (date) {
      sql += " AND m.match_date = ?";
      params.push(date);
    }

    sql += " ORDER BY m.match_date, m.match_time";

    const matches = await query(sql, params);
    return NextResponse.json({ code: 200, data: matches });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
