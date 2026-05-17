import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取球员详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = params.id;

    const players = await query<any>(
      `SELECT p.*, t.name as team_name, t.flag_url as team_flag
       FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = ?`,
      [playerId]
    );

    if (players.length === 0) {
      return NextResponse.json({ code: 404, message: "球员不存在" }, { status: 404 });
    }

    return NextResponse.json({ code: 200, data: players[0] });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
