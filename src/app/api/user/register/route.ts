import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json({ code: 400, message: "昵称和密码不能为空" }, { status: 400 });
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json({ code: 400, message: "昵称长度需在2-20个字符之间" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ code: 400, message: "密码长度至少6位" }, { status: 400 });
    }

    // 检查昵称是否已存在
    const existing = await query("SELECT id FROM users WHERE nickname = ?", [nickname]);
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "该昵称已被注册" }, { status: 400 });
    }

    const hashedPwd = await hashPassword(password);
    const result = await execute(
      "INSERT INTO users (nickname, password) VALUES (?, ?)",
      [nickname, hashedPwd]
    );

    const token = signUserToken({ id: result.insertId, nickname });

    return NextResponse.json({
      code: 200,
      message: "注册成功",
      data: { token, userId: result.insertId, nickname },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
