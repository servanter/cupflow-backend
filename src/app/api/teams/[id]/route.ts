import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取球队详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;

    const teams = await query<any>("SELECT * FROM teams WHERE id = ?", [teamId]);
    if (teams.length === 0) {
      return NextResponse.json({ code: 404, message: "球队不存在" }, { status: 404 });
    }

    // 获取球队球员
    const players = await query(
      "SELECT id, name, photo_url, position, goals, assists FROM players WHERE team_id = ? ORDER BY position, name",
      [teamId]
    );

    // 获取球队赛程
    const matches = await query(
      `SELECT m.*, t1.name as home_team_name, t1.flag_url as home_flag,
        t2.name as away_team_name, t2.flag_url as away_flag
       FROM matches_ m
       LEFT JOIN teams t1 ON m.home_team_id = t1.id
       LEFT JOIN teams t2 ON m.away_team_id = t2.id
       WHERE m.home_team_id = ? OR m.away_team_id = ?
       ORDER BY m.match_date, m.match_time`,
      [teamId, teamId]
    );

    return NextResponse.json({
      code: 200,
      data: { ...teams[0], players, matches },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
