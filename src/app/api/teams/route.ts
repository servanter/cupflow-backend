import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 获取球队列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const continent = searchParams.get("continent");

    let sql = "SELECT * FROM teams";
    const params: any[] = [];

    if (continent) {
      sql += " WHERE continent = ?";
      params.push(continent);
    }

    sql += " ORDER BY continent, name";

    const teams = await query(sql, params);
    return NextResponse.json({ code: 200, data: teams });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
