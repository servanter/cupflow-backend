import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取精彩回放详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const highlightId = params.id;

    const highlights = await query<any>(
      `SELECT h.*, t1.name as home_team_name, t2.name as away_team_name,
        t1.flag_url as home_flag_url, t2.flag_url as away_flag_url,
        m.match_date, m.home_score, m.away_score
       FROM highlights h
       LEFT JOIN matches_ m ON h.match_id = m.id
       LEFT JOIN teams t1 ON m.home_team_id = t1.id
       LEFT JOIN teams t2 ON m.away_team_id = t2.id
       WHERE h.id = ?`,
      [highlightId]
    );

    if (highlights.length === 0) {
      return NextResponse.json({ code: 404, message: "回放不存在" }, { status: 404 });
    }

    return NextResponse.json({ code: 200, data: highlights[0] });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
