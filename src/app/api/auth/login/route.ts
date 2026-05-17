import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ code: 400, message: "用户名和密码不能为空" }, { status: 400 });
    }

    const admins = await query<any>(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (admins.length === 0) {
      return NextResponse.json({ code: 401, message: "用户名或密码错误" }, { status: 401 });
    }

    const admin = admins[0];
    const isValid = await comparePassword(password, admin.password);

    if (!isValid) {
      return NextResponse.json({ code: 401, message: "用户名或密码错误" }, { status: 401 });
    }

    const token = signAdminToken({ id: admin.id, username: admin.username });

    const response = NextResponse.json({
      code: 200,
      message: "登录成功",
      data: { token, username: admin.username },
    });

    // 设置cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24小时
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
