# Cupflow Backend - Database Schema Reference

**Database Name**: `cupflow`
**Character Set**: `utf8mb4`
**Collation**: `utf8mb4_unicode_ci`

---

## 📊 Tables Overview

| Table | Purpose | Records |
|-------|---------|---------|
| `teams` | World Cup participating teams | ~32 |
| `players` | Tournament players | ~700+ |
| `matches_` | Match schedule and scores | ~64 |
| `live_messages` | Live match commentary | Dynamic |
| `comments` | User match comments | Dynamic |
| `highlights` | Match highlights/replays | Dynamic |
| `users` | Frontend user accounts | Dynamic |
| `match_vote` | Match outcome voting | ~64 |
| `user_guess` | User predictions | Dynamic |
| `champion_predictions` | Champion voting | ~32 |
| `user_follows` | User team follows | Dynamic |
| `admins` | Admin accounts | 1+ |
| `football_news` | News articles | Dynamic |

---

## 📋 Detailed Schema

### 1. `teams` - World Cup Teams
```sql
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  flag_url VARCHAR(255) NOT NULL,
  continent VARCHAR(20) NOT NULL,
  world_cup_appearances INT NOT NULL,
  best_result VARCHAR(100) NOT NULL,
  coach VARCHAR(50) NOT NULL
);
```
**Sample Data**:
```
{ id: 1, name: "巴西", flag_url: "...", continent: "南美洲", ... }
```

---

### 2. `players` - Tournament Players
```sql
CREATE TABLE players (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  team_id INT NOT NULL,
  birth_date DATE NOT NULL,
  height VARCHAR(10) NOT NULL,
  position VARCHAR(20) NOT NULL,
  club VARCHAR(50) NOT NULL,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0
);
```
**Positions**: 前锋 (Forward), 中场 (Midfielder), 后卫 (Defender), 门将 (Goalkeeper)

---

### 3. `matches_` - Match Schedule & Results
```sql
CREATE TABLE matches_ (
  id INT PRIMARY KEY AUTO_INCREMENT,
  home_team_id INT NOT NULL,
  away_team_id INT NOT NULL,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT '未开始',
  match_time VARCHAR(20) DEFAULT '',
  match_date DATE NOT NULL,
  stage VARCHAR(50) NOT NULL,
  group_name VARCHAR(10) DEFAULT NULL
);
```
**Status Values**: 未开始, 进行中, 已结束
**Stages**: 小组赛, 1/8决赛, 半决赛, 决赛
**Group Names**: A-H (for group stage only)

---

### 4. `live_messages` - Live Match Commentary
```sql
CREATE TABLE live_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  time VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT '普通',
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Message Types**: 普通, 进球, 黄牌, 红牌, 换人
**Time Format**: "45'" (minute), "90+2'" (stoppage)

---

### 5. `comments` - User Match Comments
```sql
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Features**: Anonymous comments (nickname can be anything), like counter

---

### 6. `highlights` - Match Highlights
```sql
CREATE TABLE highlights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  occur_time VARCHAR(20) NOT NULL,
  description TEXT,
  video_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Highlight Types**: 进球, 扑救, 红牌, 点球

---

### 7. `users` - Frontend User Accounts
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Password**: bcryptjs hashed (salt rounds: 10)
**Points**: Earned from correct predictions

---

### 8. `match_vote` - Match Outcome Voting
```sql
CREATE TABLE match_vote (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  vote_home INT DEFAULT 0,
  vote_draw INT DEFAULT 0,
  vote_away INT DEFAULT 0,
  final_result VARCHAR(20) DEFAULT NULL
);
```
**Final Result**: Set to 主胜/平局/客胜 after match
**Note**: One record per match

---

### 9. `user_guess` - User Predictions
```sql
CREATE TABLE user_guess (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  user_id INT NOT NULL,
  user_choose VARCHAR(20) NOT NULL,
  is_right TINYINT DEFAULT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**User Choice**: 主胜, 平局, 客胜
**is_right Values**: NULL (pending), 1 (correct), 0 (incorrect)
**Constraint**: One prediction per user per match

---

### 10. `champion_predictions` - Champion Voting
```sql
CREATE TABLE champion_predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  votes INT DEFAULT 0
);
```
**Records**: One per team for champion voting

---

### 11. `user_follows` - User Team Follows
```sql
CREATE TABLE user_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  team_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose**: Track which teams users follow

---

### 12. `admins` - Admin Accounts
```sql
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Default Admin**: username=admin, password=admin123 (created at init)
**Password**: bcryptjs hashed

---

### 13. `football_news` - News Articles
```sql
CREATE TABLE football_news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  tag VARCHAR(30) NOT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  video_url VARCHAR(500) DEFAULT NULL,
  summary TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Tags**: 经典回顾, 球星故事, 历届盘点, 转会动态, 战术解析

---

## 🔑 Key Relationships

```
teams (1) ──── (N) players
             └─────── (N) matches_ (home_team)
             └─────── (N) matches_ (away_team)
             └─────── (N) user_follows
             └─────── (1) champion_predictions

matches_ (1) ───── (N) live_messages
             ├───── (N) comments
             ├───── (N) highlights
             ├───── (1) match_vote
             └───── (N) user_guess

users (1) ───── (N) user_guess
         ├───── (N) user_follows
         └───── (N) comments (implicit via nickname)

admins (N) ──── Content Management (no direct FK)
```

---

## 📈 Query Patterns

### Get Match Details with Teams
```sql
SELECT m.*, 
       t1.name as home_team_name, t1.flag_url as home_flag,
       t2.name as away_team_name, t2.flag_url as away_flag
FROM matches_ m
LEFT JOIN teams t1 ON m.home_team_id = t1.id
LEFT JOIN teams t2 ON m.away_team_id = t2.id
WHERE m.id = ?
```

### Get User Profile with Predictions
```sql
SELECT ug.id, ug.match_id, ug.user_choose, ug.is_right,
       m.home_team_id, m.away_team_id, m.home_score, m.away_score,
       t1.name as home_team_name, t2.name as away_team_name
FROM user_guess ug
LEFT JOIN matches_ m ON ug.match_id = m.id
LEFT JOIN teams t1 ON m.home_team_id = t1.id
LEFT JOIN teams t2 ON m.away_team_id = t2.id
WHERE ug.user_id = ?
ORDER BY ug.create_time DESC
```

### Calculate Group Standings
```sql
-- Fetch completed group stage matches
SELECT * FROM matches_
WHERE stage = '小组赛' AND status = '已结束'
AND group_name = ?

-- Then calculate wins, draws, losses, goals, points in-memory
```

### Get User Ranking
```sql
SELECT COUNT(*) as rank FROM users 
WHERE points > (SELECT points FROM users WHERE id = ?)
-- Rank = result + 1
```

---

## 🛡️ Constraints & Indexes

### Unique Constraints
- `users.nickname` - UNIQUE
- `admins.username` - UNIQUE

### Foreign Keys (Implicit, no explicit FKs in schema)
- `matches_.home_team_id` → `teams.id`
- `matches_.away_team_id` → `teams.id`
- `players.team_id` → `teams.id`
- `live_messages.match_id` → `matches_.id`
- `comments.match_id` → `matches_.id`
- `highlights.match_id` → `matches_.id`
- `match_vote.match_id` → `matches_.id`
- `user_guess.match_id` → `matches_.id`
- `user_guess.user_id` → `users.id`
- `champion_predictions.team_id` → `teams.id`
- `user_follows.user_id` → `users.id`
- `user_follows.team_id` → `teams.id`

---

## 💾 Backup Recommendations

1. **Regular Backups**: Daily (contains match results)
2. **Critical Data**: `admins`, `matches_`, `user_guess` (for points)
3. **Non-Critical**: `comments`, `live_messages` (can be regenerated)

---

## 🚀 Performance Considerations

### Indexes to Consider Adding
```sql
-- Match queries
CREATE INDEX idx_match_date ON matches_(match_date);
CREATE INDEX idx_match_stage ON matches_(stage);
CREATE INDEX idx_match_status ON matches_(status);

-- User queries
CREATE INDEX idx_user_guess_user_id ON user_guess(user_id);
CREATE INDEX idx_user_guess_match_id ON user_guess(match_id);
CREATE INDEX idx_user_follows_user_id ON user_follows(user_id);

-- Content
CREATE INDEX idx_comment_match_id ON comments(match_id);
CREATE INDEX idx_live_message_match_id ON live_messages(match_id);
CREATE INDEX idx_highlight_match_id ON highlights(match_id);
```

---

**Last Updated**: 2026-05-18
