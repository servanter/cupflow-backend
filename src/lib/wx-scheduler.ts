import { query, execute } from "./db";
import { getAccessToken, refreshAccessToken } from "./wx-access-token";

const TEMPLATE_ID = "UB7Pt9frMMQPUmo0VylcYPxdY9sG5N9YLuKCW3MdE1U";

interface Subscription {
  id: number;
  openid: string;
  title: string;
  match_time: Date;
}

/**
 * 扫描到期的提醒并推送微信订阅消息
 */
async function scanAndSendReminders() {
  console.log("[wx-scheduler] 扫描待发送提醒...");
  try {
    const rows = await query<Subscription>(
      `SELECT id, openid, title, match_time
       FROM wx_subscriptions
       WHERE status = 'pending' AND send_time <= NOW()`
    );

    if (rows.length === 0) {
      console.log("[wx-scheduler] 暂无到期提醒");
      return;
    }

    console.log(`[wx-scheduler] 发现 ${rows.length} 条到期提醒，开始推送...`);
    const accessToken = await getAccessToken();

    for (const sub of rows) {
      try {
        await sendSubscribeMessage(accessToken, sub);
        await execute("UPDATE wx_subscriptions SET status='sent' WHERE id=?", [sub.id]);
        console.log(`[wx-scheduler] ✅ 已发送 id=${sub.id} openid=${sub.openid.slice(0, 8)}...`);
      } catch (err: any) {
        await execute("UPDATE wx_subscriptions SET status='failed' WHERE id=?", [sub.id]);
        console.error(`[wx-scheduler] ❌ 发送失败 id=${sub.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.error("[wx-scheduler] 扫描出错:", err.message);
  }
}

/**
 * 调用微信订阅消息接口发送单条提醒
 */
async function sendSubscribeMessage(accessToken: string, sub: Subscription) {
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
    throw new Error(`微信接口错误 ${result.errcode}: ${result.errmsg}`);
  }
}

/**
 * 启动后台调度器
 * - 每 30 分钟刷新 access_token
 * - 每 10 分钟扫描并发送到期提醒
 */
export function startWxScheduler() {
  console.log("[wx-scheduler] 调度器已启动");

  // 启动时立即执行一次
  refreshAccessToken().catch((err) =>
    console.error("[wx-scheduler] 初始 access_token 获取失败:", err.message)
  );
  scanAndSendReminders();

  // 每 30 分钟刷新 access_token
  setInterval(() => {
    refreshAccessToken().catch((err) =>
      console.error("[wx-scheduler] access_token 刷新失败:", err.message)
    );
  }, 30 * 60 * 1000);

  // 每 10 分钟扫描提醒
  setInterval(scanAndSendReminders, 10 * 60 * 1000);
}
