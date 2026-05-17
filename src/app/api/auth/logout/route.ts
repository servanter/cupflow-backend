import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ code: 200, message: "退出成功" });
  response.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
  return response;
}
