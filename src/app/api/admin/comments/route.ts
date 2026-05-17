import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const comments = await query("SELECT * FROM comments ORDER BY created_at DESC LIMIT 200");
    return NextResponse.json({ code: 200, data: comments });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
