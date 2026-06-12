import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取最近赛程：未开始 + 进行中的比赛，按日期时间升序取前5场
export async function GET(request: NextRequest) {
  try {
    const baseSql = `
      SELECT m.*, t1.name as home_team_name, t1.flag_url as home_flag,
        t2.name as away_team_name, t2.flag_url as away_flag
      FROM matches_ m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
    `;

    const matches = await query(
      `${baseSql} WHERE m.status != '已结束' ORDER BY m.match_date, m.match_time LIMIT 5`,
      []
    );

    return NextResponse.json({
      code: 200,
      data: { matches },
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
