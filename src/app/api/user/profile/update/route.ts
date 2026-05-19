import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { nickname, avatarUrl } = await request.json();

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json({ code: 400, message: "昵称不能为空" }, { status: 400 });
    }

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length > 20) {
      return NextResponse.json({ code: 400, message: "昵称不能超过20个字符" }, { status: 400 });
    }

    await execute(
      "UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?",
      [trimmedNickname, avatarUrl || "", user.id]
    );

    return NextResponse.json({
      code: 200,
      message: "更新成功",
      data: {
        nickname: trimmedNickname,
        avatarUrl: avatarUrl || "",
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
