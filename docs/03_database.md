# 🗄️ CupFlow 数据库文档

**数据库**: `cupflow` | **字符集**: `utf8mb4_unicode_ci` | **连接**: 见 `.env` 配置

---

## 📊 表结构总览

| 表名 | 用途 | 说明 |
|------|------|------|
| `users` | 前台用户账号 | 昵称登录 + 微信登录 |
| `admins` | 管理员账号 | 后台管理 |
| `teams` | 球队信息 | 32 支参赛队 |
| `players` | 球员信息 | 700+ 球员 |
| `matches_` | 赛程与比分 | 约 64 场比赛 |
| `match_vote` | 比赛投票统计 | 每场一条记录 |
| `user_guess` | 用户竞猜记录 | 动态增长 |
| `user_follows` | 用户关注球队 | 动态增长 |
| `champion_predictions` | 冠军投票 | 每队一条 |
| `live_messages` | 直播评论 | 动态增长 |
| `comments` | 比赛评论 | 匿名，动态增长 |
| `highlights` | 比赛集锦 | 动态增长 |
| `football_news` | 新闻资讯 | 动态增长 |

---

## 📋 详细表结构

### `users` — 前台用户

```sql
CREATE TABLE users (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  nickname    VARCHAR(50)  NOT NULL UNIQUE,   -- 用户昵称（2-20字符）
  password    VARCHAR(255) NOT NULL,           -- bcryptjs 加密（10轮 salt）
  openid      VARCHAR(100) UNIQUE DEFAULT NULL,-- 微信 openid（需迁移添加）
  avatar_url  VARCHAR(255) DEFAULT '',         -- 头像 URL（需迁移添加）
  points      INT DEFAULT 0,                   -- 竞猜积分
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> ⚠️ **注意**: 初始建表脚本不含 `openid` 和 `avatar_url`，需执行迁移（见下方）

---

### `admins` — 管理员

```sql
CREATE TABLE admins (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,           -- bcryptjs 加密
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 默认账号: admin / admin123
```

---

### `teams` — 球队

```sql
CREATE TABLE teams (
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  name                  VARCHAR(50)  NOT NULL,
  flag_url              VARCHAR(255) NOT NULL,
  continent             VARCHAR(20)  NOT NULL,
  world_cup_appearances INT NOT NULL,
  best_result           VARCHAR(100) NOT NULL,
  coach                 VARCHAR(50)  NOT NULL
);
```

---

### `players` — 球员

```sql
CREATE TABLE players (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  name      VARCHAR(50)  NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  team_id   INT NOT NULL,                      -- FK → teams.id
  birth_date DATE NOT NULL,
  height    VARCHAR(10)  NOT NULL,
  position  VARCHAR(20)  NOT NULL,             -- 前锋/中场/后卫/门将
  club      VARCHAR(50)  NOT NULL,
  goals     INT DEFAULT 0,
  assists   INT DEFAULT 0
);
```

---

### `matches_` — 赛程与比分

```sql
CREATE TABLE matches_ (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  home_team_id INT NOT NULL,                   -- FK → teams.id
  away_team_id INT NOT NULL,                   -- FK → teams.id
  home_score   INT DEFAULT 0,
  away_score   INT DEFAULT 0,
  status       VARCHAR(20) DEFAULT '未开始',   -- 未开始 | 进行中 | 已结束
  match_time   VARCHAR(20) DEFAULT '',         -- 格式: "14:00"
  match_date   DATE NOT NULL,
  stage        VARCHAR(50) NOT NULL,           -- 小组赛 | 1/8决赛 | 半决赛 | 决赛
  group_name   VARCHAR(10) DEFAULT NULL        -- A-H（仅小组赛）
);
```

---

### `match_vote` — 比赛投票统计

```sql
CREATE TABLE match_vote (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  match_id     INT NOT NULL,                   -- FK → matches_.id（每场唯一）
  vote_home    INT DEFAULT 0,
  vote_draw    INT DEFAULT 0,
  vote_away    INT DEFAULT 0,
  final_result VARCHAR(20) DEFAULT NULL        -- 主胜 | 平局 | 客胜（比赛结束后设置）
);
```

---

### `user_guess` — 用户竞猜记录

```sql
CREATE TABLE user_guess (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  match_id    INT NOT NULL,                    -- FK → matches_.id
  user_id     INT NOT NULL,                    -- FK → users.id
  user_choose VARCHAR(20) NOT NULL,            -- 主胜 | 平局 | 客胜
  is_right    TINYINT DEFAULT NULL,            -- NULL=未结算, 1=猜对, 0=猜错
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 约束: 同一用户同一比赛只能竞猜一次
```

---

### `user_follows` — 用户关注球队

```sql
CREATE TABLE user_follows (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,                     -- FK → users.id
  team_id    INT NOT NULL,                     -- FK → teams.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 约束: 同一用户同一球队只能关注一次
```

---

### `champion_predictions` — 冠军投票

```sql
CREATE TABLE champion_predictions (
  id      INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,                        -- FK → teams.id（每队一条）
  votes   INT DEFAULT 0
);
```

---

### `live_messages` — 直播评论

```sql
CREATE TABLE live_messages (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  match_id   INT NOT NULL,                     -- FK → matches_.id
  time       VARCHAR(20) NOT NULL,             -- 比赛时间，如 "45'" "90+2'"
  type       VARCHAR(20) DEFAULT '普通',       -- 普通 | 进球 | 黄牌 | 红牌 | 换人
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### `comments` — 比赛评论

```sql
CREATE TABLE comments (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  match_id   INT NOT NULL,                     -- FK → matches_.id
  nickname   VARCHAR(50) NOT NULL,             -- 匿名，无需登录
  content    TEXT NOT NULL,
  likes      INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### `highlights` — 比赛集锦

```sql
CREATE TABLE highlights (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  match_id    INT NOT NULL,                    -- FK → matches_.id
  title       VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL,           -- 进球 | 扑救 | 红牌 | 点球
  occur_time  VARCHAR(20)  NOT NULL,
  description TEXT,
  video_url   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### `football_news` — 新闻资讯

```sql
CREATE TABLE football_news (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  title      VARCHAR(200) NOT NULL,
  tag        VARCHAR(30)  NOT NULL,            -- 经典回顾 | 球星故事 | 历届盘点 | 转会动态 | 战术解析
  cover_url  VARCHAR(500) DEFAULT NULL,
  video_url  VARCHAR(500) DEFAULT NULL,
  summary    TEXT,
  content    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔑 表关系图

```
teams (1) ──── (N) players
         ├──── (N) matches_ (home_team)
         ├──── (N) matches_ (away_team)
         ├──── (N) user_follows
         └──── (1) champion_predictions

matches_ (1) ──── (N) live_messages
          ├──── (N) comments
          ├──── (N) highlights
          ├──── (1) match_vote
          └──── (N) user_guess

users (1) ──── (N) user_guess
        └──── (N) user_follows
```

---

## 🔧 数据库迁移

### 必须执行的迁移（添加 users 表缺失字段）

```sql
-- 连接数据库（使用 .env 中配置的连接信息）
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME

-- 添加微信登录字段
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE COMMENT '微信openid';

-- 添加头像字段
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT '' COMMENT '用户头像URL';

-- 验证
DESCRIBE users;
```

> ✅ 这两条 ALTER TABLE 是安全的，不会丢失现有数据

---

## 📈 常用查询模式

### 获取比赛详情（含球队信息）

```sql
SELECT m.*,
       t1.name as home_team_name, t1.flag_url as home_flag,
       t2.name as away_team_name, t2.flag_url as away_flag
FROM matches_ m
LEFT JOIN teams t1 ON m.home_team_id = t1.id
LEFT JOIN teams t2 ON m.away_team_id = t2.id
WHERE m.id = ?
```

### 获取用户竞猜历史（多表 JOIN）

```sql
SELECT ug.id, ug.match_id, ug.user_choose, ug.is_right, ug.create_time,
       m.home_score, m.away_score, m.match_date, m.stage,
       t1.name as home_team_name, t2.name as away_team_name
FROM user_guess ug
LEFT JOIN matches_ m ON ug.match_id = m.id
LEFT JOIN teams t1 ON m.home_team_id = t1.id
LEFT JOIN teams t2 ON m.away_team_id = t2.id
WHERE ug.user_id = ?
ORDER BY ug.create_time DESC
```

### 计算用户排名

```sql
-- 排名 = 比当前用户积分高的人数 + 1
SELECT COUNT(*) as rank FROM users
WHERE points > (SELECT points FROM users WHERE id = ?)
```

### 条件查询比赛（动态 WHERE）

```typescript
let sql = "SELECT * FROM matches_ WHERE 1=1";
const params: any[] = [];

if (status) { sql += " AND status = ?"; params.push(status); }
if (stage)  { sql += " AND stage = ?";  params.push(stage); }
if (date)   { sql += " AND match_date = ?"; params.push(date); }

sql += " ORDER BY match_date, match_time";
const matches = await query(sql, params);
```

### 分页查询

```typescript
const page = Math.max(1, Number(searchParams.get("page")) || 1);
const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
const offset = (page - 1) * limit;

const items = await query("SELECT * FROM table ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
const countResult = await query<any>("SELECT COUNT(*) as total FROM table");
const total = countResult[0]?.total || 0;
```

---

## 🚀 性能优化建议

建议添加以下索引：

```sql
-- 比赛查询
CREATE INDEX idx_match_date   ON matches_(match_date);
CREATE INDEX idx_match_stage  ON matches_(stage);
CREATE INDEX idx_match_status ON matches_(status);

-- 用户查询
CREATE INDEX idx_user_guess_user_id  ON user_guess(user_id);
CREATE INDEX idx_user_guess_match_id ON user_guess(match_id);
CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);

-- 内容查询
CREATE INDEX idx_comment_match_id      ON comments(match_id);
CREATE INDEX idx_live_message_match_id ON live_messages(match_id);
CREATE INDEX idx_highlight_match_id    ON highlights(match_id);
```

---

## 💾 备份建议

- **重要数据**（需定期备份）: `admins`, `matches_`, `user_guess`, `users`
- **可重建数据**: `comments`, `live_messages`（可从其他来源重建）
- **建议频率**: 每日备份
