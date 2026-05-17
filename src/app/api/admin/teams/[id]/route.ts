import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

// 更新球队
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { name, flag_url, continent, world_cup_appearances, best_result, coach } = body;

    await execute(
      "UPDATE teams SET name=?, flag_url=?, continent=?, world_cup_appearances=?, best_result=?, coach=? WHERE id=?",
      [name, flag_url, continent, world_cup_appearances, best_result, coach, params.id]
    );

    return NextResponse.json({ code: 200, message: "更新成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 删除球队
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    await execute("DELETE FROM teams WHERE id = ?", [params.id]);
    return NextResponse.json({ code: 200, message: "删除成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
