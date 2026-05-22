import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    const { title, image_url, link_url_mp, link_url_h5, sort_order, is_active } = await request.json();
    if (!image_url) return NextResponse.json({ code: 400, message: "图片链接不能为空" });

    await execute(
      "UPDATE banners SET title=?, image_url=?, link_url_mp=?, link_url_h5=?, sort_order=?, is_active=? WHERE id=?",
      [title || "", image_url, link_url_mp || "", link_url_h5 || "", sort_order ?? 0, is_active ?? 1, params.id]
    );
    return NextResponse.json({ code: 200, message: "更新成功" });
  } catch {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });

    await execute("DELETE FROM banners WHERE id=?", [params.id]);
    return NextResponse.json({ code: 200, message: "删除成功" });
  } catch {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
