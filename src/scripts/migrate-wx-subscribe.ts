import mysql from "mysql2/promise";

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "101.96.207.88",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "HONGyan8158",
    database: process.env.DB_NAME || "cupflow",
    connectTimeout: 30000,
  });

  console.log("✅ 数据库连接成功");

  // 1. users 表补列
  try {
    await connection.query("ALTER TABLE users ADD COLUMN openid VARCHAR(100) DEFAULT NULL UNIQUE COMMENT '微信用户openid'");
    console.log("✅ users.openid 列创建成功");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("⏭️  users.openid 列已存在，跳过");
    } else throw e;
  }

  try {
    await connection.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT '' COMMENT '头像URL'");
    console.log("✅ users.avatar_url 列创建成功");
  } catch (e: any) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("⏭️  users.avatar_url 列已存在，跳过");
    } else throw e;
  }

  // 2. 微信 access_token 缓存表（只有一行）
  await connection.query(`
    CREATE TABLE IF NOT EXISTS wx_access_token (
      id INT PRIMARY KEY AUTO_INCREMENT,
      access_token VARCHAR(512) NOT NULL COMMENT 'access_token 值',
      expires_at DATETIME NOT NULL COMMENT '过期时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间'
    ) COMMENT='微信AccessToken缓存（只有一行）'
  `);
  console.log("✅ wx_access_token 表创建成功");

  // 3. 订阅消息提醒表
  await connection.query(`
    CREATE TABLE IF NOT EXISTS wx_subscriptions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL COMMENT '关联用户ID',
      openid VARCHAR(100) NOT NULL COMMENT '微信用户openid',
      match_id INT DEFAULT NULL COMMENT '关联比赛ID',
      title VARCHAR(255) NOT NULL COMMENT '提醒标题（如：法国 vs 巴西）',
      match_time DATETIME NOT NULL COMMENT '比赛开始时间',
      send_time DATETIME NOT NULL COMMENT '计划推送时间（比赛前60分钟）',
      status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending/sent/failed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_match (user_id, match_id)
    ) COMMENT='微信订阅消息提醒记录表'
  `);
  console.log("✅ wx_subscriptions 表创建成功");

  await connection.end();
  console.log("\n🎉 迁移完成！");
}

migrate().catch((err) => {
  console.error("❌ 迁移失败:", err.message);
  process.exit(1);
});
