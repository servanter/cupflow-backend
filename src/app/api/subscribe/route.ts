import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const WX_APPID = process.env.WX_APPID || "wxeacde40b235f447b";
const WX_SECRET = process.env.WX_SECRET || "597df83e929dca0ce9491bac809c276f";

/**
 * POST /api/subscribe
 * 用户同意订阅后，保存提醒记录
 * Body: { code, matchId, title, matchTime }
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "请先登录" }, { status: 401 });
    }

    const { code, matchId, title, matchTime } = await request.json();

    if (!code || !title || !matchTime) {
      return NextResponse.json({ code: 400, message: "缺少必要参数" }, { status: 400 });
    }

    // 1. 用 code 换取 openid
    const sessionUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    const sessionRes = await fetch(sessionUrl);
    const sessionData: any = await sessionRes.json();

    if (sessionData.errcode) {
      return NextResponse.json(
        { code: 400, message: `获取openid失败: ${sessionData.errmsg}` },
        { status: 400 }
      );
    }

    const openid: string = sessionData.openid;

    // 2. 更新 users 表中的 openid（方便后续识别用户）
    await execute("UPDATE users SET openid = ? WHERE id = ?", [openid, user.id]);

    // 3. 计算推送时间 = 比赛时间 - 60 分钟
    const matchDate = new Date(matchTime);
    if (isNaN(matchDate.getTime())) {
      return NextResponse.json({ code: 400, message: "比赛时间格式错误" }, { status: 400 });
    }
    const sendTime = new Date(matchDate.getTime() - 60 * 60 * 1000);

    // 4. 若比赛已过期（推送时间早于现在），不允许订阅
    if (sendTime <= new Date()) {
      return NextResponse.json({ code: 400, message: "比赛即将开始，已无法设置提醒" }, { status: 400 });
    }

    // 5. 插入或重置订阅记录（同一用户同一场比赛只保留一条）
    await execute(
      `INSERT INTO wx_subscriptions (user_id, openid, match_id, title, match_time, send_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE
         openid    = VALUES(openid),
         send_time = VALUES(send_time),
         status    = 'pending'`,
      [user.id, openid, matchId || null, title, matchDate, sendTime]
    );

    return NextResponse.json({ code: 200, message: "提醒已设置" });
  } catch (error: any) {
    console.error("[subscribe POST]", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

/**
 * GET /api/subscribe
 * 查询当前用户的订阅提醒列表
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "请先登录" }, { status: 401 });
    }

    const rows = await query(
      `SELECT s.id, s.title, s.match_time, s.send_time, s.status,
              s.match_id,
              m.home_team_id, m.away_team_id,
              ht.name AS home_team_name, at.name AS away_team_name
       FROM wx_subscriptions s
       LEFT JOIN matches_ m ON s.match_id = m.id
       LEFT JOIN teams ht ON m.home_team_id = ht.id
       LEFT JOIN teams at ON m.away_team_id = at.id
       WHERE s.user_id = ?
       ORDER BY s.match_time ASC`,
      [user.id]
    );

    return NextResponse.json({ code: 200, data: rows });
  } catch (error: any) {
    console.error("[subscribe GET]", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

/**
 * OPTIONS — 处理 CORS 预检
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
