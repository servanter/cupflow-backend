import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// 获取某场比赛的投票数据
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;

    // 获取投票统计
    let votes = await query<any>(
      "SELECT * FROM match_vote WHERE match_id = ?",
      [matchId]
    );

    if (votes.length === 0) {
      // 自动创建投票记录
      await execute("INSERT INTO match_vote (match_id) VALUES (?)", [matchId]);
      votes = [{ match_id: matchId, vote_home: 0, vote_draw: 0, vote_away: 0, final_result: null }];
    }

    // 检查当前用户是否已竞猜
    const user = getUserFromRequest(request);
    let userGuess = null;
    if (user) {
      const guesses = await query<any>(
        "SELECT * FROM user_guess WHERE match_id = ? AND user_id = ?",
        [matchId, user.id]
      );
      if (guesses.length > 0) {
        userGuess = guesses[0];
      }
    }

    return NextResponse.json({
      code: 200,
      data: { vote: votes[0], userGuess },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 用户提交竞猜
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "请先登录" }, { status: 401 });
    }

    const matchId = params.matchId;
    const { choice } = await request.json(); // 主胜/平局/客胜

    if (!["主胜", "平局", "客胜"].includes(choice)) {
      return NextResponse.json({ code: 400, message: "无效的竞猜选择" }, { status: 400 });
    }

    // 检查比赛状态
    const matches = await query<any>("SELECT status FROM matches_ WHERE id = ?", [matchId]);
    if (matches.length === 0) {
      return NextResponse.json({ code: 404, message: "赛事不存在" }, { status: 404 });
    }
    if (matches[0].status !== "未开始") {
      return NextResponse.json({ code: 400, message: "比赛已开始，不能竞猜" }, { status: 400 });
    }

    // 检查是否已提交
    const existing = await query(
      "SELECT id FROM user_guess WHERE match_id = ? AND user_id = ?",
      [matchId, user.id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "已提交过竞猜" }, { status: 400 });
    }

    // 提交竞猜
    await execute(
      "INSERT INTO user_guess (match_id, user_id, user_choose) VALUES (?, ?, ?)",
      [matchId, user.id, choice]
    );

    // 更新投票总数
    if (choice === "主胜") {
      await execute("UPDATE match_vote SET vote_home = vote_home + 1 WHERE match_id = ?", [matchId]);
    } else if (choice === "平局") {
      await execute("UPDATE match_vote SET vote_draw = vote_draw + 1 WHERE match_id = ?", [matchId]);
    } else {
      await execute("UPDATE match_vote SET vote_away = vote_away + 1 WHERE match_id = ?", [matchId]);
    }

    return NextResponse.json({ code: 200, message: "竞猜成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
