import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const body = await request.json();
    const { home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name } = body;

    await execute(
      "INSERT INTO matches_ (home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [home_team_id, away_team_id, home_score || 0, away_score || 0, status || "未开始", match_time, match_date, stage, group_name || null]
    );

    return NextResponse.json({ code: 200, message: "添加成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
