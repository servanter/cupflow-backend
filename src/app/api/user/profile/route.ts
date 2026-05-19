import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const users = await query<any>(
      "SELECT id, nickname, points, avatar_url, created_at FROM users WHERE id = ?",
      [user.id]
    );

    if (users.length === 0) {
      return NextResponse.json({ code: 404, message: "用户不存在" }, { status: 404 });
    }

    // 计算排名
    const rankResult = await query<any>(
      "SELECT COUNT(*) as `rank` FROM users WHERE points > (SELECT points FROM users WHERE id = ?)",
      [user.id]
    );
    const rank = (rankResult[0]?.rank || 0) + 1;

    // 获取竞猜记录
    let guesses: any[] = [];
    try {
      guesses = await query<any>(
        `SELECT ug.id, ug.match_id, ug.user_choose, ug.is_right, ug.create_time,
          m.home_team_id, m.away_team_id, m.home_score, m.away_score, m.match_date, m.stage,
          t1.name as home_team_name, t2.name as away_team_name
         FROM user_guess ug
         LEFT JOIN matches_ m ON ug.match_id = m.id
         LEFT JOIN teams t1 ON m.home_team_id = t1.id
         LEFT JOIN teams t2 ON m.away_team_id = t2.id
         WHERE ug.user_id = ? ORDER BY ug.create_time DESC`,
        [user.id]
      );
    } catch (e) {
      console.error("Guesses query error:", e);
      guesses = [];
    }

    // 获取关注球队
    let follows: any[] = [];
    try {
      follows = await query<any>(
        `SELECT uf.id, uf.team_id, t.name, t.flag_url FROM user_follows uf
         LEFT JOIN teams t ON uf.team_id = t.id
         WHERE uf.user_id = ?`,
        [user.id]
      );
    } catch (e) {
      console.error("Follows query error:", e);
      follows = [];
    }

    return NextResponse.json({
      code: 200,
      data: {
        ...users[0],
        rank,
        guesses,
        follows,
      },
    });
  } catch (error: any) {
    console.error("Profile API Error:", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
