import mysql from "mysql2/promise";

/**
 * 更新世界杯数据为2026年官方抽签结果
 * 根据2025年12月5日华盛顿抽签仪式的真实分组
 */
async function updateToRealDraw() {
  const connection = await mysql.createConnection({
    host: "101.96.207.88",
    port: 3306,
    user: "root",
    password: "HONGyan8158",
    database: "cupflow",
    connectTimeout: 30000,
  });

  console.log("✅ 数据库连接成功");

  // ========== 第一步：查看当前球队 ==========
  const [existingTeams] = (await connection.query("SELECT id, name FROM teams")) as any[];
  const existingMap: Record<string, number> = {};
  for (const t of existingTeams) {
    existingMap[t.name] = t.id;
  }
  console.log(`当前库中有 ${existingTeams.length} 支球队`);

  // ========== 第二步：需要新增的球队（附加赛占位 + 库中缺失的） ==========
  // 欧洲附加赛占位球队
  const newTeams = [
    // 附加赛待定名额（用占位名）
    ["欧洲附加赛A", "https://flagcdn.com/w80/eu.png", "欧洲", 0, "附加赛待定", "待确认"],
    ["欧洲附加赛B", "https://flagcdn.com/w80/eu.png", "欧洲", 0, "附加赛待定", "待确认"],
    ["欧洲附加赛C", "https://flagcdn.com/w80/eu.png", "欧洲", 0, "附加赛待定", "待确认"],
    ["欧洲附加赛D", "https://flagcdn.com/w80/eu.png", "欧洲", 0, "附加赛待定", "待确认"],
    ["洲际附加赛1", "https://flagcdn.com/w80/un.png", "待定", 0, "附加赛待定", "待确认"],
    ["洲际附加赛2", "https://flagcdn.com/w80/un.png", "待定", 0, "附加赛待定", "待确认"],
  ];

  // 检查哪些球队库中没有，需要新增
  const needed: string[][] = [];
  for (const t of newTeams) {
    if (!existingMap[t[0] as string]) {
      needed.push(t);
    }
  }

  if (needed.length > 0) {
    console.log(`⏳ 新增 ${needed.length} 支占位球队...`);
    for (const team of needed) {
      await connection.execute(
        "INSERT INTO teams (name, flag_url, continent, world_cup_appearances, best_result, coach) VALUES (?, ?, ?, ?, ?, ?)",
        team
      );
    }
    console.log("✅ 占位球队新增完成");
  }

  // 重新获取完整的球队映射
  const [allTeams] = (await connection.query("SELECT id, name FROM teams")) as any[];
  const teamMap: Record<string, number> = {};
  for (const t of allTeams) {
    teamMap[t.name] = t.id;
  }

  // ========== 第三步：清除旧赛程和投票数据 ==========
  console.log("⏳ 清除旧赛程数据...");
  await connection.execute("DELETE FROM match_vote");
  await connection.execute("DELETE FROM live_messages");
  await connection.execute("DELETE FROM user_guess");
  await connection.execute("DELETE FROM matches_");
  // 重置自增ID
  await connection.execute("ALTER TABLE matches_ AUTO_INCREMENT = 1");
  console.log("✅ 旧数据已清除");

  // ========== 第四步：插入真实分组赛程 ==========
  // 官方2026世界杯分组（2025.12.5 华盛顿抽签结果）
  const groups: Record<string, string[]> = {
    "A组": ["墨西哥", "南非", "韩国", "欧洲附加赛D"],
    "B组": ["加拿大", "欧洲附加赛A", "卡塔尔", "瑞士"],
    "C组": ["巴西", "摩洛哥", "海地", "苏格兰"],
    "D组": ["美国", "巴拉圭", "澳大利亚", "欧洲附加赛C"],
    "E组": ["德国", "库拉索", "科特迪瓦", "厄瓜多尔"],
    "F组": ["荷兰", "日本", "欧洲附加赛B", "突尼斯"],
    "G组": ["比利时", "埃及", "伊朗", "新西兰"],
    "H组": ["西班牙", "佛得角", "沙特阿拉伯", "乌拉圭"],
    "I组": ["法国", "塞内加尔", "洲际附加赛2", "挪威"],
    "J组": ["阿根廷", "阿尔及利亚", "奥地利", "约旦"],
    "K组": ["葡萄牙", "洲际附加赛1", "乌兹别克斯坦", "哥伦比亚"],
    "L组": ["英格兰", "克罗地亚", "加纳", "巴拿马"],
  };

  // 小组赛日期安排（每组6场，共72场）
  // 开赛时间: 2026-06-11，每天安排2-3组比赛
  const groupSchedule: Record<string, { dates: string[]; times: string[][] }> = {
    "A组": {
      dates: ["2026-06-11", "2026-06-11", "2026-06-17", "2026-06-17", "2026-06-23", "2026-06-23"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
    "B组": {
      dates: ["2026-06-12", "2026-06-12", "2026-06-18", "2026-06-18", "2026-06-24", "2026-06-24"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
    "C组": {
      dates: ["2026-06-12", "2026-06-12", "2026-06-18", "2026-06-18", "2026-06-24", "2026-06-24"],
      times: [["06:00"], ["09:00"], ["06:00"], ["09:00"], ["09:00"], ["09:00"]],
    },
    "D组": {
      dates: ["2026-06-13", "2026-06-13", "2026-06-19", "2026-06-19", "2026-06-25", "2026-06-25"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
    "E组": {
      dates: ["2026-06-13", "2026-06-13", "2026-06-19", "2026-06-19", "2026-06-25", "2026-06-25"],
      times: [["06:00"], ["09:00"], ["06:00"], ["09:00"], ["09:00"], ["09:00"]],
    },
    "F组": {
      dates: ["2026-06-14", "2026-06-14", "2026-06-20", "2026-06-20", "2026-06-26", "2026-06-26"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
    "G组": {
      dates: ["2026-06-14", "2026-06-14", "2026-06-20", "2026-06-20", "2026-06-26", "2026-06-26"],
      times: [["06:00"], ["09:00"], ["06:00"], ["09:00"], ["09:00"], ["09:00"]],
    },
    "H组": {
      dates: ["2026-06-15", "2026-06-15", "2026-06-21", "2026-06-21", "2026-06-27", "2026-06-27"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
    "I组": {
      dates: ["2026-06-15", "2026-06-15", "2026-06-21", "2026-06-21", "2026-06-27", "2026-06-27"],
      times: [["06:00"], ["09:00"], ["06:00"], ["09:00"], ["09:00"], ["09:00"]],
    },
    "J组": {
      dates: ["2026-06-16", "2026-06-16", "2026-06-22", "2026-06-22", "2026-06-28", "2026-06-28"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
    "K组": {
      dates: ["2026-06-16", "2026-06-16", "2026-06-22", "2026-06-22", "2026-06-28", "2026-06-28"],
      times: [["06:00"], ["09:00"], ["06:00"], ["09:00"], ["09:00"], ["09:00"]],
    },
    "L组": {
      dates: ["2026-06-17", "2026-06-17", "2026-06-23", "2026-06-23", "2026-06-29", "2026-06-29"],
      times: [["00:00"], ["03:00"], ["00:00"], ["03:00"], ["03:00"], ["03:00"]],
    },
  };

  console.log("⏳ 插入真实分组赛程...");
  let totalMatches = 0;

  for (const [groupName, teamNames] of Object.entries(groups)) {
    const [t1, t2, t3, t4] = teamNames;
    const schedule = groupSchedule[groupName];

    // 每组6场: 1v2, 3v4, 1v3, 2v4, 1v4, 2v3（经典赛程编排）
    const matchPairs = [
      [t1, t2], // 第1轮
      [t3, t4],
      [t1, t3], // 第2轮
      [t4, t2],
      [t4, t1], // 第3轮
      [t2, t3],
    ];

    for (let i = 0; i < 6; i++) {
      const [home, away] = matchPairs[i];
      const homeId = teamMap[home];
      const awayId = teamMap[away];

      if (!homeId || !awayId) {
        console.log(`⚠️ 找不到球队: ${home}(${homeId}) 或 ${away}(${awayId})`);
        continue;
      }

      await connection.execute(
        "INSERT INTO matches_ (home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name) VALUES (?, ?, 0, 0, '未开始', ?, ?, '小组赛', ?)",
        [homeId, awayId, schedule.times[i][0], schedule.dates[i], groupName]
      );
      totalMatches++;
    }
  }

  console.log(`✅ 已插入 ${totalMatches} 场小组赛`);

  // ========== 第五步：为每场比赛创建投票记录 ==========
  const [matchRows] = (await connection.query("SELECT id FROM matches_")) as any[];
  console.log("⏳ 创建投票记录...");
  for (const row of matchRows) {
    await connection.execute("INSERT IGNORE INTO match_vote (match_id, vote_home, vote_draw, vote_away) VALUES (?, 0, 0, 0)", [row.id]);
  }
  console.log("✅ 投票记录创建完成");

  // ========== 第六步：重新初始化冠军预测 ==========
  console.log("⏳ 重新初始化冠军预测...");
  await connection.execute("DELETE FROM champion_predictions");
  for (const name of Object.keys(teamMap)) {
    // 占位球队不参与冠军预测
    if (name.includes("附加赛")) continue;
    await connection.execute("INSERT IGNORE INTO champion_predictions (team_id, votes) VALUES (?, 0)", [teamMap[name]]);
  }
  console.log("✅ 冠军预测初始化完成");

  await connection.end();

  console.log("\n🎉 ========================================");
  console.log("🏆 2026世界杯真实分组数据更新完成！");
  console.log("========================================");
  console.log("📋 12个小组 (A-L)");
  console.log(`⚽ ${totalMatches} 场小组赛`);
  console.log("📊 投票记录已重建");
  console.log("🏅 冠军预测已重建");
  console.log("⚠️  6个附加赛名额待确定（2026年3月）");
  console.log("========================================\n");
}

updateToRealDraw().catch((err) => {
  console.error("❌ 更新失败:", err);
  process.exit(1);
});
