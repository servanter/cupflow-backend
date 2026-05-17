import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取最近赛程：优先今日，若今日无赛事则找最近的比赛日
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

    // 先查今天
    const todayMatches = await query(
      `${baseSql} WHERE m.match_date = ? ORDER BY m.match_time`,
      [today]
    );

    if ((todayMatches as any[]).length > 0) {
      return NextResponse.json({
        code: 200,
        data: { matches: todayMatches, matchDate: today, isToday: true },
      });
    }

    // 今天没有比赛，查最近的下一个比赛日
    const nextRows = await query(
      `SELECT DISTINCT match_date FROM matches_ WHERE match_date > ? ORDER BY match_date LIMIT 1`,
      [today]
    );

    if ((nextRows as any[]).length > 0) {
      const nextDate = (nextRows as any[])[0].match_date;
      const nextMatches = await query(
        `${baseSql} WHERE m.match_date = ? ORDER BY m.match_time`,
        [nextDate]
      );
      return NextResponse.json({
        code: 200,
        data: { matches: nextMatches, matchDate: nextDate, isToday: false },
      });
    }

    // 未来没有比赛了，查最近一个已结束的比赛日
    const lastRows = await query(
      `SELECT DISTINCT match_date FROM matches_ WHERE match_date <= ? ORDER BY match_date DESC LIMIT 1`,
      [today]
    );

    if ((lastRows as any[]).length > 0) {
      const lastDate = (lastRows as any[])[0].match_date;
      const lastMatches = await query(
        `${baseSql} WHERE m.match_date = ? ORDER BY m.match_time`,
        [lastDate]
      );
      return NextResponse.json({
        code: 200,
        data: { matches: lastMatches, matchDate: lastDate, isToday: false },
      });
    }

    return NextResponse.json({
      code: 200,
      data: { matches: [], matchDate: today, isToday: true },
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
