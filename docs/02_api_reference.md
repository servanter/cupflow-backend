# 🔌 CupFlow API 完整参考

**Base URL**: `http://localhost:3000/api`  
**认证方式**: `Authorization: Bearer <token>`  
**Content-Type**: `application/json`

---

## 🔐 认证 API

### 用户注册
```
POST /user/register
Body: { nickname: string, password: string }
验证: 昵称 2-20 字符，密码至少 6 位，昵称唯一
Response: { code: 200, data: { token, userId, nickname } }
```

### 用户登录
```
POST /user/login
Body: { nickname: string, password: string }
Response: { code: 200, data: { token, userId, nickname, points } }
```

### 微信登录
```
POST /user/wechat-login
Body: { code: string }  ← 微信授权 code
开发 Mock: code 传 "mock" 或 "the code is a mock one"
Response: { code: 200, data: { token, userId, nickname, points } }
```

### 管理员登录
```
POST /auth/login
Body: { username: string, password: string }
Response: { code: 200, data: { token, username } }
Cookie: admin_token (httpOnly, 24h)
```

### 管理员登出
```
POST /auth/logout
Auth: Admin
Response: { code: 200 }
```

---

## 👤 用户 API

### 获取用户资料
```
GET /user/profile
Auth: User
Response: {
  code: 200,
  data: {
    id, nickname, points, avatar_url, created_at,
    rank,           ← 实时计算的排名
    guesses: [...], ← 竞猜历史（含比赛信息）
    follows: [...]  ← 关注的球队
  }
}
```

### 更新用户资料
```
POST /user/profile/update
Auth: User
Body: { nickname: string, avatarUrl?: string }
Response: { code: 200, data: { nickname, avatarUrl } }
```

### 上传头像
```
POST /user/avatar/upload
Auth: User
Body: FormData（字段名 "file"）
限制: jpeg/png/gif/webp，最大 2MB
Response: { code: 200, data: { avatarUrl: "/uploads/avatars/xxx.jpg" } }
```

### 获取关注列表
```
GET /user/follows
Auth: User
Response: { code: 200, data: [{ id, team_id, name, flag_url, continent }] }
```

### 添加关注
```
POST /user/follows
Auth: User
Body: { teamId: number }
Response: { code: 200, message: "关注成功" }
```

### 取消关注
```
DELETE /user/follows?teamId=<id>
Auth: User
Response: { code: 200, message: "取消关注成功" }
```

---

## ⚽ 比赛 API

### 获取比赛列表
```
GET /matches?status=<status>&stage=<stage>&date=<date>
Query Params:
  status: 未开始 | 进行中 | 已结束
  stage:  小组赛 | 1/8决赛 | 半决赛 | 决赛
  date:   YYYY-MM-DD
Response: { code: 200, data: [...matches] }
```

### 获取比赛详情
```
GET /matches/[id]
Response: { code: 200, data: { match } }
```

### 今日比赛
```
GET /matches/today
Response: { code: 200, data: [...matches] }
```

### 小组积分榜
```
GET /matches/standings?group=<A-H>
Response: { code: 200, data: { A: [...teams], B: [...teams], ... } }
```

### 创建比赛（管理员）
```
POST /admin/matches
Auth: Admin
Body: { home_team_id, away_team_id, match_time, match_date, stage, group_name? }
Response: { code: 200, message: "添加成功" }
```

### 更新比赛（管理员）
```
PUT /admin/matches/[id]
Auth: Admin
Body: { home_score?, away_score?, status?, ... }
Response: { code: 200, message: "更新成功" }
```

### 删除比赛（管理员）
```
DELETE /admin/matches/[id]
Auth: Admin
Response: { code: 200, message: "删除成功" }
```

---

## 🏆 球队 API

### 获取球队列表
```
GET /teams
Response: { code: 200, data: [...teams] }
```

### 获取球队详情
```
GET /teams/[id]
Response: { code: 200, data: { team } }
```

### 创建/更新/删除球队（管理员）
```
POST   /admin/teams          Body: { name, flag_url, continent, world_cup_appearances, best_result, coach }
PUT    /admin/teams/[id]     Body: { name?, flag_url?, ... }
DELETE /admin/teams/[id]
```

---

## 👥 球员 API

### 射手榜
```
GET /players/top-scorers
Response: { code: 200, data: [...players] }
```

### 球员详情
```
GET /players/[id]
Response: { code: 200, data: { player } }
```

### 创建/更新/删除球员（管理员）
```
POST   /admin/players        Body: { name, photo_url, team_id, birth_date, height, position, club }
PUT    /admin/players/[id]
DELETE /admin/players/[id]
```

---

## 📰 新闻 API

### 新闻列表
```
GET /news
Response: { code: 200, data: [...articles] }
```

### 新闻详情
```
GET /news/[id]
Response: { code: 200, data: { article } }
```

### 创建/更新/删除新闻（管理员）
```
POST   /admin/news           Body: { title, tag, cover_url?, video_url?, summary, content }
PUT    /admin/news/[id]
DELETE /admin/news/[id]
```

---

## 🎯 竞猜 API

### 获取竞猜数据
```
GET /guess/[matchId]
Response: {
  code: 200,
  data: {
    vote: { vote_home, vote_draw, vote_away, final_result },
    userGuess?: { user_choose, is_right, ... }
  }
}
```

### 提交竞猜
```
POST /guess/[matchId]
Auth: User
Body: { choice: "主胜" | "平局" | "客胜" }
限制: 比赛状态必须为"未开始"，每人每场只能竞猜一次
Response: { code: 200, message: "竞猜成功" }
```

### 冠军投票
```
POST /vote/champion
Body: { team_id: number }
Response: { code: 200, message: "投票成功" }
```

### 积分排行榜
```
GET /rank
Response: { code: 200, data: [...rankings] }
```

---

## 💬 评论 API

### 获取比赛评论
```
GET /comments/[matchId]
Response: { code: 200, data: [...comments] }
```

### 发表评论
```
POST /comments/[matchId]
Body: { nickname: string, content: string }  ← 匿名，无需登录
Response: { code: 200, message: "发表成功" }
```

### 点赞评论
```
POST /comment-like/[id]
Response: { code: 200, message: "点赞成功" }
```

### 管理评论（管理员）
```
GET    /admin/comments
DELETE /admin/comments/[id]
```

---

## 🔴 直播评论 API

### 获取直播消息
```
GET /live/[matchId]
Response: { code: 200, data: [...messages] }
```

### 创建/更新/删除直播消息（管理员）
```
POST   /admin/live           Body: { match_id, time, type: "普通"|"进球"|"黄牌"|"红牌"|"换人", content }
PUT    /admin/live/[id]
DELETE /admin/live/[id]
```

---

## ✨ 集锦 API

### 集锦列表 / 详情
```
GET /highlights
GET /highlights/[id]
```

### 创建/更新/删除集锦（管理员）
```
POST   /admin/highlights     Body: { match_id, title, type, occur_time, description, video_url }
PUT    /admin/highlights/[id]
DELETE /admin/highlights/[id]
```

---

## 👨‍💼 用户管理（管理员）

```
GET    /admin/users          ← 用户列表
DELETE /admin/users/[id]     ← 删除用户
```

---

## 📊 响应码说明

| Code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 🧪 快速测试示例

```bash
# 用户注册
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"nickname":"player123","password":"pass123"}'

# 用户登录（获取 token）
TOKEN=$(curl -s -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"nickname":"player123","password":"pass123"}' | jq -r '.data.token')

# 获取用户资料
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer $TOKEN"

# 管理员登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
