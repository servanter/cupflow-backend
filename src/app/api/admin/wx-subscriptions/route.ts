import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending | sent | failed | all
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        ws.id, ws.user_id, ws.openid, ws.match_id,
        ws.title, ws.match_time, ws.send_time,
        ws.status, ws.created_at,
        u.nickname as user_nickname,
        CONCAT(t1.name, ' vs ', t2.name) as match_teams
      FROM wx_subscriptions ws
      LEFT JOIN users u ON ws.user_id = u.id
      LEFT JOIN matches_ m ON ws.match_id = m.id
      LEFT JOIN teams t1 ON m.home_team_id = t1.id
      LEFT JOIN teams t2 ON m.away_team_id = t2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== "all") {
      sql += " AND ws.status = ?";
      params.push(status);
    }

    sql += " ORDER BY ws.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const rows = await query<any>(sql, params);

    // 统计各状态数量
    const statsRows = await query<any>(
      `SELECT status, COUNT(*) as count FROM wx_subscriptions GROUP BY status`
    );
    const stats: Record<string, number> = { pending: 0, sent: 0, failed: 0 };
    for (const r of statsRows) {
      stats[r.status] = Number(r.count);
    }
    stats.total = stats.pending + stats.sent + stats.failed;

    // 总数（用于分页）
    let countSql = "SELECT COUNT(*) as total FROM wx_subscriptions WHERE 1=1";
    const countParams: any[] = [];
    if (status && status !== "all") {
      countSql += " AND status = ?";
      countParams.push(status);
    }
    const countResult = await query<any>(countSql, countParams);
    const total = countResult[0]?.total || 0;

    return NextResponse.json({
      code: 200,
      data: { list: rows, total, page, limit, stats },
    });
  } catch (error: any) {
    console.error("[admin/wx-subscriptions GET]", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
