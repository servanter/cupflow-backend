import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取最近赛程：从今天起往后取最近5场（跨天），若未来没有则取最近5场已结束的
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const baseSql = `
      SELECT m.*, t1.name as home_team_name, t1.flag_url as home_flag,
        t2.name as away_team_name, t2.flag_url as away_flag
      FROM matches_ m
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
    `;

    // 从今天起，取最近的5场比赛（含今天进行中和未开始的）
    const upcoming = await query(
      `${baseSql} WHERE m.match_date >= ? ORDER BY m.match_date, m.match_time LIMIT 5`,
      [today]
    );

    if ((upcoming as any[]).length > 0) {
      return NextResponse.json({
        code: 200,
        data: { matches: upcoming },
      });
    }

    // 未来没有比赛了，取最近5场已结束的
    const recent = await query(
      `${baseSql} ORDER BY m.match_date DESC, m.match_time DESC LIMIT 5`,
      []
    );

    return NextResponse.json({
      code: 200,
      data: { matches: recent },
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
