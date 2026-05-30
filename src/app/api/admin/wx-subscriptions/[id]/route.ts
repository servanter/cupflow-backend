import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { getAccessToken } from "@/lib/wx-access-token";

const TEMPLATE_ID = "UB7Pt9frMMQPUmo0VylcYPxdY9sG5N9YLuKCW3MdE1U";

// DELETE /api/admin/wx-subscriptions/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const id = params.id;
    const rows = await query<any>("SELECT id FROM wx_subscriptions WHERE id = ?", [id]);
    if (rows.length === 0) {
      return NextResponse.json({ code: 404, message: "记录不存在" }, { status: 404 });
    }

    await execute("DELETE FROM wx_subscriptions WHERE id = ?", [id]);
    return NextResponse.json({ code: 200, message: "删除成功" });
  } catch (error: any) {
    console.error("[admin/wx-subscriptions DELETE]", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// POST /api/admin/wx-subscriptions/[id]/resend  → 由 route.ts 中 action=resend 处理
// 这里用 PATCH 来触发重发
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const id = params.id;
    const rows = await query<any>(
      "SELECT id, openid, title, match_time, status FROM wx_subscriptions WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ code: 404, message: "记录不存在" }, { status: 404 });
    }

    const sub = rows[0];

    // 调用微信接口重发
    const accessToken = await getAccessToken();
    const matchTime = new Date(sub.match_time);
    const timeStr = `${matchTime.getMonth() + 1}月${matchTime.getDate()}日 ${String(matchTime.getHours()).padStart(2, "0")}:${String(matchTime.getMinutes()).padStart(2, "0")}`;

    const body = {
      touser: sub.openid,
      template_id: TEMPLATE_ID,
      page: "pages/schedule/index",
      data: {
        thing1: { value: sub.title },
        time3: { value: timeStr },
        thing5: { value: "比赛即将开始，点击查看直播！" },
      },
    };

    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result: any = await res.json();

    if (result.errcode !== 0) {
      await execute("UPDATE wx_subscriptions SET status='failed' WHERE id=?", [id]);
      return NextResponse.json(
        { code: 400, message: `微信接口错误 ${result.errcode}: ${result.errmsg}` },
        { status: 400 }
      );
    }

    await execute("UPDATE wx_subscriptions SET status='sent' WHERE id=?", [id]);
    return NextResponse.json({ code: 200, message: "重发成功" });
  } catch (error: any) {
    console.error("[admin/wx-subscriptions PATCH]", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
