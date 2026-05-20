/**
 * 手动触发一次提醒发送：
 * 1. 把所有 pending 的订阅 send_time 改为现在
 * 2. 调用 scanAndSendReminders
 */
import { query, execute } from "../lib/db";
import { getAccessToken, refreshAccessToken } from "../lib/wx-access-token";

const TEMPLATE_ID = "UB7Pt9frMMQPUmo0VylcYPxdY9sG5N9YLuKCW3MdE1U";

async function main() {
  // 先查一下现有数据
  const rows = await query<any>("SELECT id, openid, title, match_time, send_time, status FROM wx_subscriptions");
  console.log("当前 wx_subscriptions：");
  for (const r of rows) {
    console.log(`  id=${r.id} status=${r.status} title=${r.title} send_time=${r.send_time}`);
  }

  const pending = rows.filter((r: any) => r.status === "pending");
  if (pending.length === 0) {
    console.log("没有 pending 状态的订阅，退出。");
    process.exit(0);
  }

  // 把 pending 的 send_time 设为 1 分钟前（确保 <= NOW()）
  await execute(
    "UPDATE wx_subscriptions SET send_time = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE status = 'pending'"
  );
  console.log(`已将 ${pending.length} 条 pending 记录的 send_time 提前到现在`);

  // 刷新 access_token 再发送
  await refreshAccessToken();
  const accessToken = await getAccessToken();

  // 发送
  for (const sub of pending) {
    try {
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

      const res = await fetch(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const result: any = await res.json();

      if (result.errcode === 0) {
        await execute("UPDATE wx_subscriptions SET status='sent' WHERE id=?", [sub.id]);
        console.log(`✅ 发送成功 id=${sub.id}  openid=${sub.openid.slice(0, 10)}...`);
      } else {
        await execute("UPDATE wx_subscriptions SET status='failed' WHERE id=?", [sub.id]);
        console.error(`❌ 发送失败 id=${sub.id}  errcode=${result.errcode}  errmsg=${result.errmsg}`);
      }
    } catch (err: any) {
      await execute("UPDATE wx_subscriptions SET status='failed' WHERE id=?", [sub.id]);
      console.error(`❌ 异常 id=${sub.id}: ${err.message}`);
    }
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
