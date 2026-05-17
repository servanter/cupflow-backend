import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// 获取用户关注列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const follows = await query<any>(
      `SELECT uf.id, uf.team_id, t.name, t.flag_url, t.continent
       FROM user_follows uf
       LEFT JOIN teams t ON uf.team_id = t.id
       WHERE uf.user_id = ?`,
      [user.id]
    );

    return NextResponse.json({ code: 200, data: follows });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 添加关注
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json({ code: 400, message: "球队ID不能为空" }, { status: 400 });
    }

    // 检查是否已关注
    const existing = await query(
      "SELECT id FROM user_follows WHERE user_id = ? AND team_id = ?",
      [user.id, teamId]
    );
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "已关注该球队" }, { status: 400 });
    }

    await execute(
      "INSERT INTO user_follows (user_id, team_id) VALUES (?, ?)",
      [user.id, teamId]
    );

    return NextResponse.json({ code: 200, message: "关注成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 取消关注
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json({ code: 400, message: "球队ID不能为空" }, { status: 400 });
    }

    await execute(
      "DELETE FROM user_follows WHERE user_id = ? AND team_id = ?",
      [user.id, Number(teamId)]
    );

    return NextResponse.json({ code: 200, message: "取消关注成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
