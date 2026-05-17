import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取积分排行榜
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit")) || 20;

    const rankings = await query<any>(
      `SELECT u.id, u.nickname, u.points,
        (SELECT COUNT(*) FROM user_guess WHERE user_id = u.id AND is_right = 1) as correct_count
       FROM users u
       WHERE u.points > 0
       ORDER BY u.points DESC
       LIMIT ?`,
      [limit]
    );

    return NextResponse.json({ code: 200, data: rankings });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
