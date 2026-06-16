# CupFlow 数据更新指南

---

## ⚡ 赛后数据三件套 SOP（每次赛后 30 分钟内完成）

> 每场比赛结束后，需要同步更新三类数据：**① 比分** · **② 文字直播** · **③ 球员进球/助攻**。
> 按此流程操作，避免遗漏。

---

### 第一步：拉取比赛信息（1～2 分钟）

用 **WebFetch** 或 **WebSearch** 获取：比分、进球球员、进球时间、助攻、红牌。

```
# ✅ 优先：实测可抓到实际比分（FT=已结束）
https://www.sofascore.com/tournament/football/world/fifa-world-cup/16

# ✅ 备用
https://www.flashscore.com/football/world/world-cup-2026/
```

WebFetch prompt：
```
获取所有已结束比赛的比分、进球球员姓名、进球时间、助攻球员
```

如果 WebFetch 失败，改用 **WebSearch**，关键词：
```
FIFA World Cup 2026 results scorers [具体日期如 June 13]
2026世界杯 今日比分 进球 [具体球队名]
```

---

### 第二步：查出比赛 ID（1 分钟）

```bash
npx tsx -e "
import { query } from './src/lib/db';
async function main() {
  const r = await query(\`SELECT m.id, t1.name home, t2.name away, m.status, m.match_date
    FROM matches_ m
    JOIN teams t1 ON m.home_team_id=t1.id
    JOIN teams t2 ON m.away_team_id=t2.id
    WHERE m.status != '已结束'
    ORDER BY m.match_date\`);
  console.log(JSON.stringify(r, null, 2));
}
main().then(() => process.exit(0));
"
```

---

### 第三步：更新比分 + 直播（复用模板）

```bash
cp src/scripts/_template-update-scores.ts src/scripts/update-scores-YYYYMMDD.ts
# 只改 completedMatches（比分）和 liveData（直播事件）
npx tsx src/scripts/update-scores-YYYYMMDD.ts
```

---

### 第四步：更新球员进球/助攻 ⭐

> **注意**：比分和进球是两回事！更新了 home_score/away_score，并不会自动更新 `players.goals`。
> 必须单独执行这一步。

#### 4-1. 先确认进球球员在不在 players 表

```bash
npx tsx -e "
import { query } from './src/lib/db';
async function main() {
  // 按球队名筛选，核对球员名
  const r = await query(\`SELECT p.id, p.name, p.goals, t.name as team
    FROM players p JOIN teams t ON p.team_id = t.id
    WHERE t.name = '墨西哥'\`);   // 改成对应球队
  console.log(JSON.stringify(r, null, 2));
}
main().then(() => process.exit(0));
"
```

#### 4-2. 若球员不存在，先插入

进球球员不在库里时（常见于 128 名核心球员之外的冷门球员），用以下模板插入：

```bash
npx tsx -e "
import { execute } from './src/lib/db';
async function main() {
  function avatar(name: string) {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&size=200&background=random';
  }
  await execute(
    'INSERT INTO players (name, photo_url, team_id, birth_date, height, position, club, goals, assists) VALUES (?,?,?,?,?,?,?,?,?)',
    ['希门尼斯', avatar('希门尼斯'), 3, '1991-05-05', '188cm', '前锋', '富勒姆', 0, 0]
    //            ↑名字            ↑team_id      ↑生日       ↑身高  ↑位置   ↑俱乐部
  );
  console.log('插入成功');
}
main().then(() => process.exit(0));
"
```

**team_id 速查**（常用球队）：

| 球队 | team_id |
|------|---------|
| 阿根廷 | 1 |
| 巴西 | 2 |
| 墨西哥 | 3 |
| 捷克 | 24 |
| 韩国 | 27 |

> 其他 team_id：`SELECT id, name FROM teams ORDER BY name`

#### 4-3. 更新进球/助攻数

```bash
npx tsx -e "
import { execute, query } from './src/lib/db';
async function main() {
  // ⬇️ 只改这里：player_id + 最新累计进球数
  const updates = [
    { id: 129, goals: 1, assists: 0 },  // 基尼奥内斯
    { id: 130, goals: 1, assists: 0 },  // 希门尼斯
  ];
  for (const u of updates) {
    await execute('UPDATE players SET goals=?, assists=? WHERE id=?', [u.goals, u.assists, u.id]);
    console.log('更新 id=' + u.id + ' goals=' + u.goals);
  }
  // 验证：打印当前射手榜
  const top = await query(\`SELECT p.name, p.goals, p.assists, t.name as team
    FROM players p JOIN teams t ON p.team_id = t.id
    WHERE p.goals > 0 ORDER BY p.goals DESC LIMIT 10\`);
  console.log('\\n📊 射手榜:', JSON.stringify(top, null, 2));
}
main().then(() => process.exit(0));
"
```

> **goals 填累计总数**，不是本场进球数。例如球员已有 2 球、本场再进 1 球 → 填 3。

---

### 第五步：验证 API（30 秒）

```bash
curl "http://localhost:3000/api/players/top-scorers?limit=10"
```

返回 `data` 数组非空即表示射手榜更新成功。

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

## 十、赛后更新清单（每场比赛结束后）

> 按顺序勾选，全部完成后射手榜、直播、积分均实时准确。

- [ ] **① 比分** — `home_score`, `away_score`, `status='已结束'`（使用模板脚本）
- [ ] **② 文字直播** — `live_messages`（先 DELETE 旧数据再 INSERT）
- [ ] **③ 球员进球/助攻** — `players.goals`, `players.assists`（见上方第四步 SOP）
- [ ] **精彩回放** — `highlights` 表（可选，有精彩集锦时补充）
- [ ] 如有**淘汰赛**需新增赛程：`stage='淘汰赛'`，`group_name=NULL`

**低频更新（赛季初或换帅时）：**
- [ ] **球员俱乐部** — 赛季初大批转会时更新
- [ ] **主教练** — 偶有临时换帅

---

## 十一、已录入进球球员记录（2026 世界杯）

> 每次新增球员时追加此表，方便快速查 id。

| id | 姓名 | 球队 | team_id | 进球 | 助攻 | 录入日期 |
|----|------|------|---------|------|------|----------|
| 129 | 基尼奥内斯 | 墨西哥 | 3 | 1 | 0 | 2026-06-12 |
| 130 | 希门尼斯 | 墨西哥 | 3 | 1 | 0 | 2026-06-12 |

> **A 组揭幕战（2026-06-11）**：墨西哥 2-0 南非
> - 基尼奥内斯（9'）· 希门尼斯（67'）

---

## 十二、时区与 match_date 经验总结（2026-06-16）

> ⚠️ **每次更新前必读此节**，这是最容易出错的地方。

### match_date 存储规律

`match_date` 字段存储的是 **UTC 时间，固定为北京比赛日前一天 16:00**，即北京时间当天 00:00 对应的 UTC 值：

```
match_date = 北京比赛日 前一天 T16:00:00.000Z（UTC）
```

| 北京比赛日 | match_date（数据库原始值） | match_time（北京时间） |
|---|---|---|
| 6月16日 | 2026-06-15T16:00:00.000Z | 03:00 / 06:00 / 09:00 / 12:00 |
| 6月17日 | 2026-06-16T16:00:00.000Z | 03:00 / 06:00 |

`match_time` 字段直接存储**北京时间**，如 "03:00"、"06:00"。

### 判断比赛是否已结束

```
北京实际比赛时间 = match_date(UTC) + 8小时（得到北京0点） + match_time
```

与当前北京时间对比，超过约 2 小时即可认为已结束。

**不能只看 match_date 的日期数字！** 例如：
- `match_date = 2026-06-16T16:00:00.000Z`，match_time = "03:00"
- → 北京时间是 **6月17日 03:00**，不是16日
- → 现在是6月16日21:40，这场**还没踢**

### 常见错误

**错误1：把"北京时间17日凌晨"的比赛当成明天**
- 场景：沙特vs乌拉圭 match_time=03:00，看到 match_date 含 "16" 就以为是今天16日，但实际北京时间是17日03:00（今天已经过了）
- 结论：当前是16日21:40，17日03:00已经是今天凌晨，比赛早结束了

**错误2：手动修复时 match_date 写错一天**
- 排查：和同一北京比赛日的其他记录对比 match_date，若不一致则有误
- 修复：直接用 SQL 从正确记录复制，不要手动构造 Date 对象
```sql
-- 从同天正确比赛复制 match_date（最安全）
UPDATE matches_ 
SET match_date = (SELECT match_date FROM (SELECT match_date FROM matches_ WHERE id = <正确同天id>) t)
WHERE id IN (<错误id1>, <错误id2>);
```

**错误3：用 Node.js `new Date()` 写入时区错位**
- 原因：MySQL 连接时区设置导致 Date 对象被偏移
- 解决：始终用 SQL 复制已有正确记录的值，不手动构造

### 每次更新前检查清单

1. `date` 命令确认当前北京时间
2. 查未结束比赛列表，确认哪些在当前时间之前应已结束
3. 和同一北京日已知正确比赛对比 match_date，确认一致
4. 搜索结果用**中新社、澎湃新闻**核实，不用预测文章
5. 更新后 SELECT 验证，不假设写入成功

### 可信数据来源排序

1. ✅ 中新社 chinanews.com（标注"当地时间X日"，可反推北京时间）
2. ✅ 澎湃新闻 thepaper.cn
3. ✅ 央视网 worldcup.cctv.com（权威但更新较慢）
4. ⚠️ 乐体育、FIFA Watch（每天只更新1-2次，不实时）
5. ❌ 预测/前瞻类文章（不可用于核实比分）
