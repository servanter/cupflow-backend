import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// 获取冠军预测投票数据
export async function GET(request: NextRequest) {
  try {
    const predictions = await query<any>(
      `SELECT cp.*, t.name, t.flag_url
       FROM champion_predictions cp
       LEFT JOIN teams t ON cp.team_id = t.id
       ORDER BY cp.votes DESC`
    );

    return NextResponse.json({ code: 200, data: predictions });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 提交冠军投票
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "请先登录" }, { status: 401 });
    }

    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json({ code: 400, message: "球队ID不能为空" }, { status: 400 });
    }

    // 增加投票数
    const existing = await query("SELECT id FROM champion_predictions WHERE team_id = ?", [teamId]);
    if (existing.length === 0) {
      await execute("INSERT INTO champion_predictions (team_id, votes) VALUES (?, 1)", [teamId]);
    } else {
      await execute("UPDATE champion_predictions SET votes = votes + 1 WHERE team_id = ?", [teamId]);
    }

    return NextResponse.json({ code: 200, message: "投票成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
