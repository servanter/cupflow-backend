import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json({ code: 400, message: "昵称和密码不能为空" }, { status: 400 });
    }

    const users = await query<any>("SELECT * FROM users WHERE nickname = ?", [nickname]);
    if (users.length === 0) {
      return NextResponse.json({ code: 401, message: "昵称或密码错误" }, { status: 401 });
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ code: 401, message: "昵称或密码错误" }, { status: 401 });
    }

    const token = signUserToken({ id: user.id, nickname: user.nickname });

    return NextResponse.json({
      code: 200,
      message: "登录成功",
      data: { token, userId: user.id, nickname: user.nickname, points: user.points },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
