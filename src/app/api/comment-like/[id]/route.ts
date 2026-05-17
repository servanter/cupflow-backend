import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";

// 评论点赞
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id;

    await execute("UPDATE comments SET likes = likes + 1 WHERE id = ?", [commentId]);

    return NextResponse.json({ code: 200, message: "点赞成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
