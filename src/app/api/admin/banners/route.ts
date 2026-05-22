import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET() {
  try {
    const rows = await query(
      "SELECT * FROM banners ORDER BY sort_order ASC"
    );
    return NextResponse.json({ code: 200, data: rows });
  } catch {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const { title, image_url, link_url_mp, link_url_h5, sort_order, is_active } = await request.json();
    if (!image_url) return NextResponse.json({ code: 400, message: "图片链接不能为空" });

    await execute(
      "INSERT INTO banners (title, image_url, link_url_mp, link_url_h5, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [title || "", image_url, link_url_mp || "", link_url_h5 || "", sort_order ?? 0, is_active ?? 1]
    );
    return NextResponse.json({ code: 200, message: "添加成功" });
  } catch {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
