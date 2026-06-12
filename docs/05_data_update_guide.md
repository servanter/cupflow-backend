# CupFlow 数据更新指南

---

## ⚡ 快速更新比分 SOP（每次赛后 15 分钟内完成）

> 这是最常用的场景，按此流程可大幅缩短更新时间。

### 第一步：拉取最新比分（1～2 分钟）

直接用 **WebFetch** 访问以下地址（按优先级排序）：

```
# ✅ 优先用这个，实测可抓到实际比分（FT=已结束）
https://www.sofascore.com/tournament/football/world/fifa-world-cup/16

# ✅ 备用，有比赛列表，但内容可能被截断
https://www.flashscore.com/football/world/world-cup-2026/
```

WebFetch prompt 固定用：
```
获取当前所有已结束比赛的比分和状态（FT表示已结束）
```

如果 WebFetch 失败，改用 **WebSearch**，关键词：
```
FIFA World Cup 2026 results today scores [具体日期如 June 13]
2026世界杯今天比分结果 [具体组别如 B组 C组]
```

### 第二步：查出需要更新的比赛 ID（1 分钟）

```bash
node -e "
const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'101.96.207.88',port:3306,user:'root',password:'HONGyan8158',database:'cupflow'});
  const [r] = await c.query(\"SELECT m.id, t1.name home, t2.name away, m.status, m.match_date FROM matches_ m JOIN teams t1 ON m.home_team_id=t1.id JOIN teams t2 ON m.away_team_id=t2.id WHERE m.status='未开始' AND m.match_date <= CURDATE() + INTERVAL 1 DAY ORDER BY m.match_date\");
  console.log(JSON.stringify(r,null,2));
  await c.end();
}
run().catch(console.error);
"
```

### 第三步：复用精简模板（仅比分+直播）

```bash
# 复制专用模板（只需改 ① ② 两处数据，其余不动）
cp src/scripts/_template-update-scores.ts src/scripts/update-scores-YYYYMMDD.ts

# 改完后执行
npx tsx src/scripts/update-scores-YYYYMMDD.ts
```

模板位置：`src/scripts/_template-update-scores.ts`
- **只需修改**：`completedMatches`（比分）和 `liveData`（直播事件）
- **不需要动**：数据库连接、ID 查找逻辑等底层代码

---

## 一、数据更新经验总结（2026-05-30）

### 背景

原始种子数据（`seed-data.ts`）中，**仅 A 组分组正确，B-L 组全部错误**，与 FIFA 官方 2025-12-05 抽签结果不符。

### 问题根因

seed 脚本编写时参考的是预测分组，而非抽签后的官方结果。世界杯开赛前需要以 FIFA 官方公告为准重新核对。

---

## 二、更新流程（可复用）

### 步骤 1：搜索官方最新数据

使用以下关键词搜索：

```
2026 FIFA World Cup groups draw official
2026世界杯 分组抽签结果 官方
```

权威来源：
- https://www.fifa.com（官网，最权威）
- https://en.wikipedia.org/wiki/2026_FIFA_World_Cup

### 步骤 2：对比现有数据库

```bash
# 查看当前数据库分组情况
npx tsx -e "..." # 或写一个临时查询脚本
```

重点检查：
- 球队分组是否与官方一致
- 揭幕战日期时间（注意时区换算）
- 主教练信息是否有变更
- 球员效力俱乐部是否已转会

### 步骤 3：执行更新脚本

```bash
cd cupflow-backend
npx tsx src/scripts/update-2026-world-cup.ts
```

### 步骤 4：验证结果

执行后检查：
- 72 场比赛分布均匀（每组 6 场）
- 揭幕战为 A 组：墨西哥 vs 南非
- 投票记录已随赛程重建（`match_vote` 表）

---

## 三、2026世界杯正确分组（FIFA 官方抽签）

> 抽签日期：2025年12月5日

| 组别 | 球队 |
|------|------|
| A组 | 墨西哥 🇲🇽 · 南非 🇿🇦 · 韩国 🇰🇷 · 捷克 🇨🇿 |
| B组 | 加拿大 🇨🇦 · 波黑 🇧🇦 · 卡塔尔 🇶🇦 · 瑞士 🇨🇭 |
| C组 | 巴西 🇧🇷 · 摩洛哥 🇲🇦 · 苏格兰 🏴󠁧󠁢󠁳󠁣󠁴󠁿 · 海地 🇭🇹 |
| D组 | 美国 🇺🇸 · 巴拉圭 🇵🇾 · 澳大利亚 🇦🇺 · 土耳其 🇹🇷 |
| E组 | 德国 🇩🇪 · 厄瓜多尔 🇪🇨 · 科特迪瓦 🇨🇮 · 库拉索 🇨🇼 |
| F组 | 荷兰 🇳🇱 · 日本 🇯🇵 · 瑞典 🇸🇪 · 突尼斯 🇹🇳 |
| G组 | 比利时 🇧🇪 · 埃及 🇪🇬 · 伊朗 🇮🇷 · 新西兰 🇳🇿 |
| H组 | 西班牙 🇪🇸 · 乌拉圭 🇺🇾 · 沙特阿拉伯 🇸🇦 · 佛得角 🇨🇻 |
| I组 | 法国 🇫🇷 · 塞内加尔 🇸🇳 · 挪威 🇳🇴 · 伊拉克 🇮🇶 |
| J组 | 阿根廷 🇦🇷 · 阿尔及利亚 🇩🇿 · 奥地利 🇦🇹 · 约旦 🇯🇴 |
| K组 | 葡萄牙 🇵🇹 · 哥伦比亚 🇨🇴 · 乌兹别克斯坦 🇺🇿 · 刚果民主共和国 🇨🇩 |
| L组 | 英格兰 🏴󠁧󠁢󠁥󠁮󠁧󠁿 · 克罗地亚 🇭🇷 · 巴拿马 🇵🇦 · 加纳 🇬🇭 |

---

## 四、赛事关键时间节点

| 阶段 | 日期 |
|------|------|
| 揭幕战 | 2026-06-11（墨西哥 vs 南非，墨西哥城） |
| 小组赛结束 | 2026-06-28 |
| 三十二强赛 | 2026-06-29 ～ 07-03 |
| 十六强赛 | 2026-07-04 ～ 07-07 |
| 八强赛 | 2026-07-09 ～ 07-11 |
| 半决赛 | 2026-07-14 ～ 07-15 |
| 决赛 | **2026-07-19**（大都会人寿体育场，新泽西） |

**时区换算**：北京时间 = 美国东部夏令时（EDT）+ 12小时

---

## 五、脚本说明

| 脚本文件 | 用途 | 执行次数 |
|----------|------|----------|
| `init-db.ts` | 建表（仅首次） | 1次 |
| `seed-data.ts` | 初始化球队 + 赛程（旧版，分组有误） | 已弃用 |
| `seed-players.ts` | 初始化 128 名球员 | 1次 |
| `seed-news.ts` | 初始化足球资讯 | 1次 |
| `update-2026-world-cup.ts` | 修正分组、更新教练/球员俱乐部 | 可重复执行 |
| `update-real-draw.ts` | 早期尝试更新抽签（已被上一个替代） | 已弃用 |
| `_template-update-scores.ts` | ⭐ **比分+直播专用模板**，复制后只改数据即可用 | 每次赛后复制使用 |
| `update-scores-YYYYMMDD.ts` | 每次赛后从模板复制出来的实际更新文件 | 按日期命名 |

> ⚠️ `update-2026-world-cup.ts` 会 **清空** matches_ 和 match_vote 表后重建，执行前确认无需保留赛果数据。

---

## 六、注意事项

### 时区

数据库存储的是**北京时间**（UTC+8），赛程时间来源是 FIFA 官网的 EDT 时间，换算公式：

```
北京时间 = EDT + 12小时
示例: 6月11日 15:00 EDT → 6月12日 03:00 北京时间
```

### 数据库连接

连接信息存储在 `.env.local`（不提交 git），格式：

```env
DB_HOST=101.96.207.88
DB_PORT=3306
DB_NAME=cupflow
DB_USER=root
DB_PASSWORD=<见本地 .env.local>
```

### 重要陷阱

- 表名是 `matches_`（带下划线），不是 `matches`（MySQL 保留字）
- `match_vote` 需要在 `matches_` 更新后重建，否则外键关联失效
- `champion_predictions` 使用 `INSERT IGNORE`，可安全重复执行

---

## 七、数据源实测结果（2026-06-12 整理）

> Claude 在更新过程中尝试了以下所有网址，记录哪些可用、哪些不可用，供下次直接使用。

### ✅ 可用数据源

| 网址 | 抓取方式 | 能获取什么 | 备注 |
|------|----------|------------|------|
| `sofascore.com/tournament/football/world/fifa-world-cup/16` | WebFetch | **比赛比分**（FT=已结束）、赛程状态 | ⭐ **最佳比分来源**，能看到实时结果 |
| `flashscore.com/football/world/world-cup-2026/` | WebFetch | 比赛列表、部分比分 | 内容有时被截断，次选 |
| `cup-worldcup.com.cn` | WebFetch | 赛事概况、赛程 | 无实时比分，仅做背景了解 |
| **WebSearch** 关键词搜索 | WebSearch | 比分、分组、球员信息 | 无法直接访问时的兜底方案，但结果夹杂AI预测需甄别 |

### ❌ 无法使用的数据源（已验证失败）

| 网址 | 失败原因 | 是否值得再试 |
|------|----------|-------------|
| `fifa.com/en/tournaments/...` | 内容为空 / 404 | ❌ 不值得 |
| `bbc.com/sport/football/world-cup` | 拒绝访问 | ❌ 不值得 |
| `espn.com/soccer/tournament/...` | 404 | ❌ 不值得 |
| `sports.sina.com.cn/wc/2026/` | 404 | ❌ 不值得 |
| `zhibo8.com/zuqiu/...` | 404 | ❌ 不值得 |
| `livetv.sx` | SSL 证书错误 | ❌ 不值得 |
| `goal.com/en/world-cup` | 404 | ❌ 不值得 |
| `worldcupbracket.net` | 404 | ❌ 不值得 |
| `bulinews.com` | 连接拒绝 | ❌ 不值得 |

### 💡 文字直播数据来源

目前没有找到可直接 WebFetch 的实时文字直播源。现有解决方案：
- **根据已知进球事件和关键事件手动撰写直播内容**（见 `update-live-scores-20260612.ts`）
- WebSearch 关键词：`墨西哥 南非 进球 事件 2026世界杯` 可搜到进球时间和红牌信息
- 后续如发现可抓取的文字直播源，在此补充

---

## 八、live_messages 表结构备忘

> ⚠️ 插入直播记录时字段名是 `time`（varchar），不是 `minute`（integer）！

```sql
CREATE TABLE live_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  match_id   INT NOT NULL,
  time       VARCHAR(20) NOT NULL,   -- 如 "9'" "45'" "90+2'"
  type       VARCHAR(20) DEFAULT '普通',  -- kickoff/goal/redcard/halftime/fulltime/normal
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

正确的插入语句：
```sql
INSERT INTO live_messages (match_id, time, type, content) VALUES (?, ?, ?, ?)
```

---

## 九、球员名称陷阱

数据库中某些球员与常见译名不同，更新前先用以下命令核查实际名称：

```bash
node -e "
const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'101.96.207.88',port:3306,user:'root',password:'HONGyan8158',database:'cupflow'});
  const [r] = await c.query(\"SELECT p.name, t.name as team, p.club FROM players p JOIN teams t ON p.team_id=t.id WHERE t.name='巴西'\");
  console.log(JSON.stringify(r,null,2));
  await c.end();
}
run().catch(console.error);
"
```

**teams 表没有 `group_name` 字段**，分组信息存在 `matches_` 表里，查球队时不能 `ORDER BY group_name`：

```bash
# ❌ 报错：Unknown column 'group_name' in 'order clause'
SELECT name, coach FROM teams ORDER BY group_name, name

# ✅ 正确：直接按名字排序
SELECT name, coach FROM teams ORDER BY name
```

**已知名称问题（2026-06-12）：**

| 常见叫法 | 数据库实际名称 | 所属球队 | 备注 |
|----------|--------------|----------|------|
| 内马尔 | ❓ 未找到 | 巴西 | 可能未录入或名称不同 |
| 范戴克 | ❓ 未找到 | 荷兰 | 可能未录入或名称不同 |
| 劳塔罗·马丁内斯 | `劳塔罗·马丁内斯` | 阿根廷 | 全名，不是"劳塔罗" |

---

## 十、下次更新清单

世界杯期间如需更新数据，依次检查：

- [ ] **比分** — `home_score`, `away_score`, `status='已结束'`
- [ ] **文字直播** — `live_messages`（先 DELETE 旧数据再 INSERT）
- [ ] **球员俱乐部** — 赛季初有大批转会需更新
- [ ] **主教练** — 偶有临时换帅
- [ ] **球员进球/助攻** — `players.goals`, `players.assists`（目前未维护）
- [ ] **精彩回放** — `highlights` 表
- [ ] 如有**淘汰赛**需新增赛程：`stage='淘汰赛'`，`group_name=NULL`
