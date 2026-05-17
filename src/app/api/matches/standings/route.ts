import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取小组赛积分榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    // 获取所有小组赛已结束的比赛
    let sql = `SELECT * FROM matches_ WHERE stage = '小组赛' AND status = '已结束'`;
    const params: any[] = [];

    if (group) {
      sql += " AND group_name = ?";
      params.push(group);
    }

    const matches = await query<any>(sql, params);

    // 获取所有球队
    const teams = await query<any>("SELECT id, name, flag_url FROM teams");
    const teamMap = new Map(teams.map((t: any) => [t.id, t]));

    // 计算积分
    const standings: Record<string, any> = {};

    for (const match of matches) {
      const homeId = match.home_team_id;
      const awayId = match.away_team_id;

      if (!standings[homeId]) {
        standings[homeId] = { team_id: homeId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, group_name: match.group_name };
      }
      if (!standings[awayId]) {
        standings[awayId] = { team_id: awayId, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0, group_name: match.group_name };
      }

      standings[homeId].played++;
      standings[awayId].played++;
      standings[homeId].goals_for += match.home_score;
      standings[homeId].goals_against += match.away_score;
      standings[awayId].goals_for += match.away_score;
      standings[awayId].goals_against += match.home_score;

      if (match.home_score > match.away_score) {
        standings[homeId].won++;
        standings[homeId].points += 3;
        standings[awayId].lost++;
      } else if (match.home_score < match.away_score) {
        standings[awayId].won++;
        standings[awayId].points += 3;
        standings[homeId].lost++;
      } else {
        standings[homeId].drawn++;
        standings[awayId].drawn++;
        standings[homeId].points += 1;
        standings[awayId].points += 1;
      }
    }

    // 组装数据并排序
    const result = Object.values(standings).map((s: any) => {
      const team = teamMap.get(s.team_id);
      return {
        ...s,
        team_name: team?.name || "未知",
        flag_url: team?.flag_url || "",
        goal_difference: s.goals_for - s.goals_against,
      };
    });

    // 按小组分组
    const grouped: Record<string, any[]> = {};
    for (const item of result) {
      const g = item.group_name || "未分组";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(item);
    }

    // 每组内按积分、净胜球、进球数排序
    for (const g of Object.keys(grouped)) {
      grouped[g].sort((a: any, b: any) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
      });
    }

    return NextResponse.json({ code: 200, data: grouped });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
