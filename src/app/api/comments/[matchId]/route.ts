import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// 获取评论列表（支持分页）
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;

    const comments = await query(
      `SELECT * FROM comments WHERE match_id = ? ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      [matchId]
    );

    // 获取总数
    const countResult = await query<any>(
      "SELECT COUNT(*) as total FROM comments WHERE match_id = ?",
      [matchId]
    );
    const total = countResult[0]?.total || 0;

    return NextResponse.json({ code: 200, data: { list: comments, total, page, limit } });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 发布评论
export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;
    const { nickname, content } = await request.json();

    if (!nickname || !content) {
      return NextResponse.json({ code: 400, message: "昵称和内容不能为空" }, { status: 400 });
    }

    if (content.length > 200) {
      return NextResponse.json({ code: 400, message: "评论内容不能超过200字" }, { status: 400 });
    }

    await execute(
      "INSERT INTO comments (match_id, nickname, content) VALUES (?, ?, ?)",
      [matchId, nickname, content]
    );

    return NextResponse.json({ code: 200, message: "评论成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
