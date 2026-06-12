/**
 * 【比分 + 文字直播 更新模板】
 *
 * 使用方法：
 *   1. 复制本文件，重命名为 update-scores-YYYYMMDD.ts
 *   2. 只修改下方 ① ② 两处数据
 *   3. npx tsx src/scripts/update-scores-YYYYMMDD.ts
 *
 * 数据来源（按优先级）：
 *   比分: WebFetch https://www.sofascore.com/tournament/football/world/fifa-world-cup/16
 *   事件: WebSearch "[主队 vs 客队] 进球时间 世界杯 2026"
 */

import mysql from "mysql2/promise";

// ─────────────────────────────────────────────
// ① 修改这里：已结束的比赛比分
// ─────────────────────────────────────────────
const completedMatches = [
  { home: "墨西哥", away: "南非",  homeScore: 2, awayScore: 0 },
  { home: "韩国",   away: "捷克",  homeScore: 2, awayScore: 1 },
  // 继续添加...
];

// ─────────────────────────────────────────────
// ② 修改这里：文字直播内容（每场一个数组）
//    time 格式: "9'" / "45+2'" / "90'"
//    type 可选: kickoff | normal | goal | yellowcard | redcard | halftime | fulltime
// ─────────────────────────────────────────────
const liveData: Record<string, Array<{ time: string; type: string; content: string }>> = {
  "墨西哥 vs 南非": [
    { time: "1'",  type: "kickoff",  content: "⚽ 比赛开始！" },
    { time: "9'",  type: "goal",     content: "⚽ 进球！墨西哥 1-0 南非 — 基尼奥内斯（9'）" },
    { time: "45'", type: "halftime", content: "⏸️ 上半场结束，墨西哥 1-0 南非" },
    { time: "67'", type: "goal",     content: "⚽ 进球！墨西哥 2-0 南非 — 希门尼斯（67'）" },
    { time: "90'", type: "fulltime", content: "🎉 终场！墨西哥 2-0 南非" },
  ],
  "韩国 vs 捷克": [
    { time: "1'",  type: "kickoff",  content: "⚽ 比赛开始！" },
    { time: "45'", type: "halftime", content: "⏸️ 上半场结束，0-0" },
    { time: "59'", type: "goal",     content: "⚽ 进球！韩国 0-1 捷克 — 克雷吉（59'）" },
    { time: "67'", type: "goal",     content: "⚽ 进球！韩国 1-1 捷克 — 黄仁范（67'）" },
    { time: "80'", type: "goal",     content: "⚽ 进球！韩国 2-1 捷克 — 吴贤揆（80'）绝杀！" },
    { time: "90'", type: "fulltime", content: "🎉 终场！韩国 2-1 捷克 逆转胜！" },
  ],
  // 继续添加其他场次...
};

// ─────────────────────────────────────────────
// 以下不需要修改
// ─────────────────────────────────────────────
async function run() {
  const db = await mysql.createConnection({
    host: "101.96.207.88", port: 3306,
    user: "root", password: "HONGyan8158", database: "cupflow",
    connectTimeout: 30000,
  });
  console.log("✅ 数据库连接成功");

  // 获取球队 ID 映射
  const [teamRows] = await db.query("SELECT id, name FROM teams") as any[];
  const teamId: Record<string, number> = {};
  for (const r of teamRows) teamId[r.name] = r.id;

  // 获取赛程 ID 映射
  const [matchRows] = await db.query("SELECT id, home_team_id, away_team_id FROM matches_") as any[];
  const findMatchId = (home: string, away: string): number | null => {
    const m = matchRows.find((r: any) => r.home_team_id === teamId[home] && r.away_team_id === teamId[away]);
    return m ? m.id : null;
  };

  // 更新比分
  console.log("\n⏳ 更新比分...");
  for (const m of completedMatches) {
    const id = findMatchId(m.home, m.away);
    if (!id) { console.log(`  ⚠️  找不到: ${m.home} vs ${m.away}`); continue; }
    await db.execute(
      "UPDATE matches_ SET home_score=?, away_score=?, status='已结束' WHERE id=?",
      [m.homeScore, m.awayScore, id]
    );
    console.log(`  ✅ ${m.home} ${m.homeScore}-${m.awayScore} ${m.away}`);
  }

  // 写入直播
  console.log("\n⏳ 写入文字直播...");
  for (const [key, messages] of Object.entries(liveData)) {
    const [home, away] = key.split(" vs ");
    const id = findMatchId(home.trim(), away.trim());
    if (!id) { console.log(`  ⚠️  找不到比赛: ${key}`); continue; }
    await db.execute("DELETE FROM live_messages WHERE match_id=?", [id]);
    for (const msg of messages) {
      await db.execute(
        "INSERT INTO live_messages (match_id, time, type, content) VALUES (?, ?, ?, ?)",
        [id, msg.time, msg.type, msg.content]
      );
    }
    console.log(`  ✅ ${key} — ${messages.length} 条直播`);
  }

  await db.end();
  console.log("\n🎉 更新完成！");
}

run().catch(err => { console.error("❌", err.message); process.exit(1); });
