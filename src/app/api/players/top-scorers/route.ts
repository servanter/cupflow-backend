import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取射手榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 10;

    const safeLimit = Math.max(1, Math.min(limit, 50));

    const scorers = await query<any>(
      `SELECT p.id, p.name, p.goals, p.photo_url, t.name as team_name, t.flag_url
       FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.goals > 0
       ORDER BY p.goals DESC
       LIMIT ${safeLimit}`
    );

    return NextResponse.json({ code: 200, data: scorers });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
