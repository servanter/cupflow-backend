import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取文字直播消息
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;

    const messages = await query(
      "SELECT * FROM live_messages WHERE match_id = ? ORDER BY created_at DESC",
      [matchId]
    );

    return NextResponse.json({ code: 200, data: messages });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
