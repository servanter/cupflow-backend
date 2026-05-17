import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取今日赛程
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const matches = await query(
      `SELECT m.*, t1.name as home_team_name, t1.flag_url as home_flag,
        t2.name as away_team_name, t2.flag_url as away_flag
       FROM matches_ m
       LEFT JOIN teams t1 ON m.home_team_id = t1.id
       LEFT JOIN teams t2 ON m.away_team_id = t2.id
       WHERE m.match_date = ?
       ORDER BY m.match_time`,
      [today]
    );

    return NextResponse.json({ code: 200, data: matches });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
