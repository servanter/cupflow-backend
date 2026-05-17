import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

// 获取所有球员（管理后台用）
export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const players = await query("SELECT * FROM players ORDER BY team_id, position, name");
    return NextResponse.json({ code: 200, data: players });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 创建球员
export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { name, photo_url, team_id, birth_date, height, position, club, goals, assists } = body;

    await execute(
      "INSERT INTO players (name, photo_url, team_id, birth_date, height, position, club, goals, assists) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, photo_url, team_id, birth_date, height, position, club, goals || 0, assists || 0]
    );

    return NextResponse.json({ code: 200, message: "添加成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
