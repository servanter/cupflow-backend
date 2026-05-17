import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const body = await request.json();
    const { home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name } = body;

    await execute(
      "UPDATE matches_ SET home_team_id=?, away_team_id=?, home_score=?, away_score=?, status=?, match_time=?, match_date=?, stage=?, group_name=? WHERE id=?",
      [home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name || null, params.id]
    );

    return NextResponse.json({ code: 200, message: "更新成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    await execute("DELETE FROM matches_ WHERE id = ?", [params.id]);
    return NextResponse.json({ code: 200, message: "删除成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
