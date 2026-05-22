import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query(
      "SELECT id, title, image_url, link_url_mp, link_url_h5, sort_order FROM banners WHERE is_active = 1 ORDER BY sort_order ASC"
    );
    return NextResponse.json({ code: 200, data: rows });
  } catch {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
