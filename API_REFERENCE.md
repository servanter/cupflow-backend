# Cupflow Backend - API Reference Quick Guide

## Base URL
```
http://localhost:3000/api
```

## Authentication Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🔐 Authentication APIs

### Admin Login
```
POST /auth/login
Body: { username: string, password: string }
Response: { code: 200, data: { token, username } }
Cookie: admin_token (httpOnly)
```

### Admin Logout
```
POST /auth/logout
Auth: Admin required
Response: { code: 200 }
```

### User Login
```
POST /user/login
Body: { nickname: string, password: string }
Response: { code: 200, data: { token, userId, nickname, points } }
```

### User Register
```
POST /user/register
Body: { nickname: string, password: string }
Response: { code: 200, message: "注册成功" }
```

---

## 🏆 Match APIs

### List Matches
```
GET /matches?status=<status>&stage=<stage>&date=<date>
Query Params:
  - status: 未开始|进行中|已结束
  - stage: 小组赛|1/8决赛|半决赛|决赛
  - date: YYYY-MM-DD
Response: { code: 200, data: [...matches] }
```

### Get Match Details
```
GET /matches/[id]
Response: { code: 200, data: { match } }
```

### Today's Matches
```
GET /matches/today
Response: { code: 200, data: [...matches] }
```

### Group Standings
```
GET /matches/standings?group=<group>
Response: { code: 200, data: { A: [...teams], B: [...teams], ... } }
```

### Create Match (Admin)
```
POST /admin/matches
Auth: Admin required
Body: { home_team_id, away_team_id, match_time, match_date, stage, group_name? }
Response: { code: 200, message: "添加成功" }
```

### Update Match (Admin)
```
PUT /admin/matches/[id]
Auth: Admin required
Body: { home_score?, away_score?, status?, ... }
Response: { code: 200, message: "更新成功" }
```

### Delete Match (Admin)
```
DELETE /admin/matches/[id]
Auth: Admin required
Response: { code: 200, message: "删除成功" }
```

---

## ⚽ Team APIs

### List Teams
```
GET /teams
Response: { code: 200, data: [...teams] }
```

### Get Team Details
```
GET /teams/[id]
Response: { code: 200, data: { team } }
```

### Create Team (Admin)
```
POST /admin/teams
Auth: Admin required
Body: { name, flag_url, continent, world_cup_appearances, best_result, coach }
Response: { code: 200, message: "添加成功" }
```

### Update Team (Admin)
```
PUT /admin/teams/[id]
Auth: Admin required
Body: { name?, flag_url?, ... }
Response: { code: 200, message: "更新成功" }
```

---

## 👤 Player APIs

### Top Scorers
```
GET /players/top-scorers
Response: { code: 200, data: [...players] }
```

### Get Player Details
```
GET /players/[id]
Response: { code: 200, data: { player } }
```

### Create Player (Admin)
```
POST /admin/players
Auth: Admin required
Body: { name, photo_url, team_id, birth_date, height, position, club }
Response: { code: 200, message: "添加成功" }
```

---

## 📰 News APIs

### List News
```
GET /news
Response: { code: 200, data: [...articles] }
```

### Get Article Details
```
GET /news/[id]
Response: { code: 200, data: { article } }
```

### Create Article (Admin)
```
POST /admin/news
Auth: Admin required
Body: { title, tag, cover_url?, video_url?, summary, content }
Response: { code: 200, message: "添加成功" }
```

---

## 🎯 Prediction/Guess APIs

### Get Prediction Data
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

### Submit Prediction
```
POST /guess/[matchId]
Auth: User required
Body: { choice: "主胜"|"平局"|"客胜" }
Response: { code: 200, message: "竞猜成功" }
```

### Vote for Champion
```
POST /vote/champion
Body: { team_id: number }
Response: { code: 200, message: "投票成功" }
```

### Get Rankings
```
GET /rank
Response: { code: 200, data: [...rankings] }
```

---

## 💬 Comment APIs

### Get Match Comments
```
GET /comments/[matchId]
Response: { code: 200, data: [...comments] }
```

### Post Comment
```
POST /comments/[matchId]
Body: { nickname: string, content: string }
Response: { code: 200, message: "发表成功" }
```

### Like Comment
```
POST /comment-like/[id]
Response: { code: 200, message: "点赞成功" }
```

---

## 🔴 Live Commentary APIs

### Get Live Messages
```
GET /live/[matchId]
Response: { code: 200, data: [...messages] }
```

### Create Live Message (Admin)
```
POST /admin/live
Auth: Admin required
Body: { match_id, time, type: "普通"|"进球"|"黄牌"|"红牌"|"换人", content }
Response: { code: 200, message: "添加成功" }
```

---

## ✨ Highlights APIs

### List Highlights
```
GET /highlights
Response: { code: 200, data: [...highlights] }
```

### Get Highlight Details
```
GET /highlights/[id]
Response: { code: 200, data: { highlight } }
```

### Create Highlight (Admin)
```
POST /admin/highlights
Auth: Admin required
Body: { match_id, title, type, occur_time, description, video_url }
Response: { code: 200, message: "添加成功" }
```

---

## 👥 User APIs

### Get User Profile
```
GET /user/profile
Auth: User required
Response: {
  code: 200,
  data: {
    id, nickname, points, rank, created_at,
    guesses: [...],
    follows: [...]
  }
}
```

### Get/Post Follows
```
GET /user/follows
POST /user/follows
Auth: User required
Body (POST): { team_id: number, action: "follow"|"unfollow" }
Response: { code: 200, data: [...followed_teams] }
```

---

## 👨‍💼 Admin User Management APIs

### List Users
```
GET /admin/users
Auth: Admin required
Response: { code: 200, data: [...users] }
```

### Delete User
```
DELETE /admin/users/[id]
Auth: Admin required
Response: { code: 200, message: "删除成功" }
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

## Standard Response Format

```json
{
  "code": 200,
  "message": "operation message",
  "data": {}
}
```

## Error Response Format

```json
{
  "code": 400,
  "message": "Error description"
}
```

---

## Default Test Credentials

**Admin Account**:
- Username: `admin`
- Password: `admin123`

---

## Common Query Parameters

- `status`: Match status filter
- `stage`: Tournament stage filter
- `date`: Date filter (YYYY-MM-DD)
- `group`: Group filter (A, B, C, etc.)

---

**Last Updated**: 2026-05-18
