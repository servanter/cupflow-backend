import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

async function initDatabase() {
  // 先连接不指定数据库，创建数据库
  const conn1 = await mysql.createConnection({
    host: "101.96.207.88",
    port: 3306,
    user: "root",
    password: "HONGyan8158",
    connectTimeout: 30000,
  });

  console.log("✅ 数据库连接成功");

  // 创建数据库
  await conn1.query("CREATE DATABASE IF NOT EXISTS cupflow DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
  console.log("✅ 数据库 cupflow 创建成功");
  await conn1.end();

  // 重新连接，指定数据库
  const connection = await mysql.createConnection({
    host: "101.96.207.88",
    port: 3306,
    user: "root",
    password: "HONGyan8158",
    database: "cupflow",
    connectTimeout: 30000,
  });

  // 创建表
  const tables = [
    `CREATE TABLE IF NOT EXISTS teams (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '球队唯一自增ID',
      name VARCHAR(50) NOT NULL COMMENT '球队中文名称',
      flag_url VARCHAR(255) NOT NULL COMMENT '球队国旗图片链接',
      continent VARCHAR(20) NOT NULL COMMENT '所属大洲名称',
      world_cup_appearances INT NOT NULL COMMENT '世界杯参赛总次数',
      best_result VARCHAR(100) NOT NULL COMMENT '球队世界杯历史最佳战绩',
      coach VARCHAR(50) NOT NULL COMMENT '球队现任主教练姓名'
    ) COMMENT='世界杯参赛球队信息表'`,

    `CREATE TABLE IF NOT EXISTS players (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '球员唯一自增ID',
      name VARCHAR(50) NOT NULL COMMENT '球员中文姓名',
      photo_url VARCHAR(255) NOT NULL COMMENT '球员头像照片链接',
      team_id INT NOT NULL COMMENT '所属球队ID',
      birth_date DATE NOT NULL COMMENT '球员出生日期',
      height VARCHAR(10) NOT NULL COMMENT '球员身高',
      position VARCHAR(20) NOT NULL COMMENT '场上位置：前锋/中场/后卫/门将',
      club VARCHAR(50) NOT NULL COMMENT '球员当前效力俱乐部',
      goals INT DEFAULT 0 COMMENT '本届世界杯进球总数',
      assists INT DEFAULT 0 COMMENT '本届世界杯助攻总数'
    ) COMMENT='参赛球员简易信息表'`,

    `CREATE TABLE IF NOT EXISTS matches_ (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '比赛唯一自增ID',
      home_team_id INT NOT NULL COMMENT '主队对应球队ID',
      away_team_id INT NOT NULL COMMENT '客队对应球队ID',
      home_score INT DEFAULT 0 COMMENT '主队实时比分',
      away_score INT DEFAULT 0 COMMENT '客队实时比分',
      status VARCHAR(20) NOT NULL DEFAULT '未开始' COMMENT '赛事状态：未开始/进行中/已结束',
      match_time VARCHAR(20) DEFAULT '' COMMENT '赛事具体开赛时分',
      match_date DATE NOT NULL COMMENT '赛事举办日期',
      stage VARCHAR(50) NOT NULL COMMENT '赛事阶段：小组赛/1/8决赛/半决赛/决赛',
      group_name VARCHAR(10) DEFAULT NULL COMMENT '小组名称（如A组、B组，仅小组赛阶段）'
    ) COMMENT='世界杯所有赛事赛程及比分表'`,

    `CREATE TABLE IF NOT EXISTS live_messages (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '直播动态唯一ID',
      match_id INT NOT NULL COMMENT '关联所属比赛ID',
      time VARCHAR(20) NOT NULL COMMENT '赛事场上时间节点',
      type VARCHAR(20) NOT NULL DEFAULT '普通' COMMENT '动态类型：普通/进球/黄牌/红牌/换人',
      content TEXT NOT NULL COMMENT '文字直播具体内容',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '动态录入系统时间'
    ) COMMENT='单场比赛文字直播内容存储表'`,

    `CREATE TABLE IF NOT EXISTS comments (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '留言唯一自增ID',
      match_id INT NOT NULL COMMENT '关联所属比赛ID',
      nickname VARCHAR(50) NOT NULL COMMENT '留言用户填写昵称',
      content TEXT NOT NULL COMMENT '留言具体内容',
      likes INT DEFAULT 0 COMMENT '留言累计点赞数量',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '留言发布时间'
    ) COMMENT='赛事直播用户评论留言表'`,

    `CREATE TABLE IF NOT EXISTS highlights (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '精彩瞬间唯一ID',
      match_id INT NOT NULL COMMENT '关联所属比赛ID',
      title VARCHAR(100) NOT NULL COMMENT '精彩瞬间简短标题',
      type VARCHAR(20) NOT NULL COMMENT '瞬间类型：进球/扑救/红牌/点球',
      occur_time VARCHAR(20) NOT NULL COMMENT '事件发生场上时间',
      description TEXT COMMENT '事件详细文字描述',
      video_url VARCHAR(255) NOT NULL COMMENT '外部视频跳转链接',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '信息录入系统时间'
    ) COMMENT='赛事精彩集锦回放信息表'`,

    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户唯一自增ID',
      nickname VARCHAR(50) NOT NULL UNIQUE COMMENT '用户专属昵称',
      password VARCHAR(255) NOT NULL COMMENT '用户密码',
      points INT DEFAULT 0 COMMENT '用户竞猜累计积分',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号注册时间'
    ) COMMENT='网站前台用户信息表'`,

    `CREATE TABLE IF NOT EXISTS match_vote (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '投票统计主键ID',
      match_id INT NOT NULL COMMENT '关联对应比赛ID',
      vote_home INT DEFAULT 0 COMMENT '支持主队胜利总票数',
      vote_draw INT DEFAULT 0 COMMENT '支持赛事平局总票数',
      vote_away INT DEFAULT 0 COMMENT '支持客队胜利总票数',
      final_result VARCHAR(20) DEFAULT NULL COMMENT '后台录入赛事最终赛果：主胜/平局/客胜'
    ) COMMENT='单场赛事大众投票总数统计表'`,

    `CREATE TABLE IF NOT EXISTS user_guess (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '竞猜记录主键ID',
      match_id INT NOT NULL COMMENT '关联对应比赛ID',
      user_id INT NOT NULL COMMENT '参与竞猜的用户ID',
      user_choose VARCHAR(20) NOT NULL COMMENT '用户竞猜选择结果：主胜/平局/客胜',
      is_right TINYINT DEFAULT NULL COMMENT '竞猜结果判定：1猜对 0猜错 NULL未结算',
      create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户提交竞猜时间'
    ) COMMENT='登录用户赛事竞猜个人记录表'`,

    `CREATE TABLE IF NOT EXISTS champion_predictions (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '投票记录主键ID',
      team_id INT NOT NULL COMMENT '对应参赛球队ID',
      votes INT DEFAULT 0 COMMENT '球队获得冠军投票总数'
    ) COMMENT='球迷心目中冠军球队投票表'`,

    `CREATE TABLE IF NOT EXISTS user_follows (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '关注记录主键ID',
      user_id INT NOT NULL COMMENT '关注操作用户ID',
      team_id INT NOT NULL COMMENT '被关注球队ID',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户关注操作时间'
    ) COMMENT='用户关注喜爱球队关联表'`,

    `CREATE TABLE IF NOT EXISTS admins (
      id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
      username VARCHAR(50) NOT NULL UNIQUE COMMENT '管理员账号',
      password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
    ) COMMENT='后台管理员账号表'`,
  ];

  for (const sql of tables) {
    await connection.query(sql);
  }
  console.log("✅ 所有数据表创建成功");

  // 插入默认管理员账号 admin/admin123
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await connection.execute(
    "INSERT IGNORE INTO admins (username, password) VALUES (?, ?)",
    ["admin", hashedPassword]
  );
  console.log("✅ 默认管理员账号创建成功 (admin / admin123)");

  await connection.end();
  console.log("🎉 数据库初始化完成！");
}

initDatabase().catch((err) => {
  console.error("❌ 数据库初始化失败:", err);
  process.exit(1);
});
