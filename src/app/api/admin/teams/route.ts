import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

// 创建球队
export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { name, flag_url, continent, world_cup_appearances, best_result, coach } = body;

    if (!name || !flag_url || !continent || !best_result || !coach) {
      return NextResponse.json({ code: 400, message: "请填写完整信息" }, { status: 400 });
    }

    await execute(
      "INSERT INTO teams (name, flag_url, continent, world_cup_appearances, best_result, coach) VALUES (?, ?, ?, ?, ?, ?)",
      [name, flag_url, continent, world_cup_appearances || 0, best_result, coach]
    );

    return NextResponse.json({ code: 200, message: "添加成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
