# CupFlow 后端项目完整探索报告

## 📋 项目概况

**项目**: CupFlow - 世界杯赛事互动网站后端  
**技术栈**: Next.js 14 + TypeScript + MySQL + JWT  
**数据库**: MySQL @ 101.96.207.88:3306  
**默认管理员**: admin / admin123

---

## 1️⃣ 数据库层 (`src/lib/db.ts`)

### 连接池配置
```typescript
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "101.96.207.88",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "HONGyan8158",
  database: process.env.DB_NAME || "cupflow",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

### 核心方法

**查询方法 - SELECT操作**
```typescript
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// 使用示例
const users = await query<any>("SELECT * FROM users WHERE nickname = ?", [nickname]);
```

**执行方法 - INSERT/UPDATE/DELETE操作**
```typescript
export async function execute(sql: string, params?: any[]) {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// 返回类型包含:
// - insertId: 新插入记录的ID
// - affectedRows: 受影响的行数
// - changedRows: 改变的行数
```

---

## 2️⃣ 认证层 (`src/lib/auth.ts`)

### JWT 生成 (Token有效期)
```typescript
const ADMIN_SECRET = process.env.JWT_SECRET || "cupflow_admin_secret_key_2026";
const USER_SECRET = process.env.JWT_USER_SECRET || "cupflow_user_secret_key_2026";

// 【普通用户Token】- 7天有效期
export function signUserToken(payload: { id: number; nickname: string }) {
  return jwt.sign(payload, USER_SECRET, { expiresIn: "7d" });
}

// 【管理员Token】- 24小时有效期
export function signAdminToken(payload: { id: number; username: string }) {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: "24h" });
}
```

### Token 验证
```typescript
export function verifyUserToken(token: string) {
  try {
    return jwt.verify(token, USER_SECRET) as { id: number; nickname: string };
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, ADMIN_SECRET) as { id: number; username: string };
  } catch {
    return null;
  }
}
```

### 密码处理
```typescript
// 生成密码哈希 (bcryptjs, 10轮 salt)
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

### 从请求提取身份信息
```typescript
// 提取用户信息 (从Authorization: Bearer token)
export function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyUserToken(token);
}

// 提取管理员信息 (同样从Authorization: Bearer token)
export function getAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyAdminToken(token);
}
```

---

## 3️⃣ Users 表结构

### 建表语句 (来自 src/scripts/init-db.ts)
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户唯一自增ID',
  nickname VARCHAR(50) NOT NULL UNIQUE COMMENT '用户专属昵称',
  password VARCHAR(255) NOT NULL COMMENT '用户密码',
  points INT DEFAULT 0 COMMENT '用户竞猜累计积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号注册时间'
) COMMENT='网站前台用户信息表'
```

### 关键字段
- **id**: 自增主键
- **nickname**: 唯一昵称（2-20个字符）
- **password**: bcryptjs加密的密码
- **points**: 竞猜积分
- **created_at**: 注册时间
- **openid** (新增): 微信登录用，见wechat-login/route.ts

### 注意事项
❌ **初始表没有 openid 字段！**
- 微信登录路由会使用 openid 字段（见第5部分）
- 需要手动添加迁移: `ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE DEFAULT NULL;`
- 需要添加: `avatar_url VARCHAR(255) DEFAULT NULL;` (用于头像存储)

---

## 4️⃣ 用户 API 路由详解

### 📌 POST /api/user/login - 账密登录

**文件**: `src/app/api/user/login/route.ts`

```typescript
// 请求体
{
  "nickname": "用户昵称",
  "password": "密码"
}

// 响应成功 (200)
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",  // JWT token (7天有效)
    "userId": 1,
    "nickname": "用户昵称",
    "points": 100
  }
}

// 响应失败 (401)
{
  "code": 401,
  "message": "昵称或密码错误"
}
```

**逻辑流程**
1. ✅ 参数验证 (nickname和password必填)
2. ✅ 查询用户: `SELECT * FROM users WHERE nickname = ?`
3. ✅ 密码验证: `bcrypt.compare(password, user.password)`
4. ✅ 生成Token: `signUserToken({ id: user.id, nickname: user.nickname })`
5. ✅ 返回token + 用户信息

---

### 📌 POST /api/user/register - 注册新账户

**文件**: `src/app/api/user/register/route.ts`

```typescript
// 请求体
{
  "nickname": "新昵称",
  "password": "密码"
}

// 响应成功 (200)
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGc...",  // JWT token (7天有效)
    "userId": 2,
    "nickname": "新昵称"
  }
}

// 验证失败 (400)
{
  "code": 400,
  "message": "昵称长度需在2-20个字符之间"  // 或其他错误
}
```

**逻辑流程**
1. ✅ 参数验证
   - 昵称: 长度 2-20 字符
   - 密码: 至少 6 位
2. ✅ 昵称唯一性检查: `SELECT id FROM users WHERE nickname = ?`
3. ✅ 密码加密: `hashPassword(password)` → bcryptjs加密
4. ✅ 插入用户: `INSERT INTO users (nickname, password) VALUES (?, ?)`
5. ✅ 生成Token并返回

---

### 📌 GET /api/user/profile - 获取用户资料

**文件**: `src/app/api/user/profile/route.ts`

```typescript
// 需要认证: Authorization: Bearer token

// 响应成功 (200)
{
  "code": 200,
  "data": {
    "id": 1,
    "nickname": "用户",
    "points": 100,
    "avatar_url": "/uploads/avatars/xxx.jpg",
    "created_at": "2026-05-20 10:00:00",
    "rank": 5,  // 排名计算
    "guesses": [
      {
        "id": 1,
        "match_id": 10,
        "user_choose": "主胜",
        "is_right": 1,
        "create_time": "2026-05-20 09:00:00",
        "home_team_name": "巴西",
        "away_team_name": "法国",
        "home_score": 2,
        "away_score": 1,
        "match_date": "2026-05-20",
        "stage": "小组赛"
      }
    ],
    "follows": [
      {
        "id": 1,
        "team_id": 5,
        "name": "巴西",
        "flag_url": "https://...",
        "continent": "南美"
      }
    ]
  }
}
```

**核心逻辑**
1. ✅ 提取用户: `getUserFromRequest(request)`
2. ✅ 查询用户基本信息: `SELECT id, nickname, points, avatar_url, created_at FROM users WHERE id = ?`
3. ✅ 计算排名
   ```sql
   SELECT COUNT(*) as rank FROM users 
   WHERE points > (SELECT points FROM users WHERE id = ?)
   ```
   排名 = 结果 + 1
4. ✅ 获取竞猜记录 (带多表JOIN)
5. ✅ 获取关注球队 (带多表JOIN)

---

### 📌 POST /api/user/profile/update - 更新用户资料

**文件**: `src/app/api/user/profile/update/route.ts`

```typescript
// 需要认证: Authorization: Bearer token

// 请求体
{
  "nickname": "新昵称",
  "avatarUrl": "/uploads/avatars/user_1716236400000.jpg"
}

// 响应成功 (200)
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "nickname": "新昵称",
    "avatarUrl": "/uploads/avatars/user_1716236400000.jpg"
  }
}
```

**验证规则**
- 昵称不能为空
- 昵称最长20字符
- 昵称不能被其他用户使用 (支持自己保留)

**更新SQL**
```sql
UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?
```

---

### 📌 GET /api/user/follows - 获取关注列表

**文件**: `src/app/api/user/follows/route.ts`

```typescript
// 需要认证: Authorization: Bearer token

// 响应成功 (200)
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "team_id": 5,
      "name": "巴西",
      "flag_url": "https://...",
      "continent": "南美"
    }
  ]
}
```

---

### 📌 POST /api/user/follows - 添加关注

```typescript
// 请求体
{
  "teamId": 5
}

// 验证
1. 检查是否已关注: SELECT id FROM user_follows WHERE user_id = ? AND team_id = ?
2. 如已存在 → 返回400 "已关注该球队"
3. 插入关注: INSERT INTO user_follows (user_id, team_id) VALUES (?, ?)
```

---

### 📌 DELETE /api/user/follows?teamId=5 - 取消关注

```typescript
// 从查询参数获取: const teamId = searchParams.get("teamId");
// 删除: DELETE FROM user_follows WHERE user_id = ? AND team_id = ?
```

---

### 📌 POST /api/user/avatar/upload - 头像上传

**文件**: `src/app/api/user/avatar/upload/route.ts`

```typescript
// 需要认证 + FormData
const formData = new FormData();
formData.append("file", imageFile);

// 响应成功 (200)
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "avatarUrl": "/uploads/avatars/1_1716236400000.jpg"
  }
}
```

**验证规则**
- MIME类型: jpeg/png/gif/webp
- 最大大小: 2MB
- 文件名格式: `${userId}_${Date.now()}.${ext}`
- 存储位置: `public/uploads/avatars/`

---

### 📌 POST /api/user/wechat-login - 微信登录

**文件**: `src/app/api/user/wechat-login/route.ts`

```typescript
// 请求体
{
  "code": "微信授权code"  // 来自微信客户端
}

// 逻辑流程
1. 用code换openid
   POST https://api.weixin.qq.com/sns/jscode2session?appid=...&secret=...&js_code=...
   
2. 查找或创建用户
   - 查询: SELECT * FROM users WHERE openid = ?
   - 如不存在: 创建用户
     昵称: "用户_" + openid后6位大写
     password: "" (空)
     openid: 存储微信openid
     
3. 生成JWT token并返回

// 开发环境 mock 支持
if (code.includes("mock") || code === "the code is a mock one") {
  // 使用 mock_openid_devtools_test
}
```

**【重要】注意事项**
- ❌ 初始users表没有openid字段！需要迁移
- ❌ 需要添加avatar_url字段
- 微信小程序配置: WX_APPID 和 WX_SECRET 在 .env 文件

---

## 5️⃣ API 路由模式与错误处理

### 标准响应格式
```typescript
// 成功响应
{
  "code": 200,
  "message": "成功信息",
  "data": { /* 实际数据 */ }
}

// 错误响应
{
  "code": 400|401|404|500,
  "message": "用户友好的错误消息"
}
```

### 错误代码约定
- **400**: 请求参数错误
- **401**: 未登录 / 权限不足
- **404**: 资源不存在
- **500**: 服务器内部错误

### 标准 API 结构
```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ 认证
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    // 2️⃣ 参数解析和验证
    const { fieldName } = await request.json();
    if (!fieldName) {
      return NextResponse.json({ code: 400, message: "参数不能为空" }, { status: 400 });
    }

    // 3️⃣ 业务逻辑 (数据库操作)
    const result = await query("SELECT ...", [params]);
    await execute("INSERT ...", [params]);

    // 4️⃣ 返回成功响应
    return NextResponse.json({
      code: 200,
      message: "操作成功",
      data: { /* 返回数据 */ }
    });

  } catch (error: any) {
    console.error("API Error:", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 6️⃣ 竞猜相关 API 参考

### POST /api/guess/[matchId] - 提交竞猜

**文件**: `src/app/api/guess/[matchId]/route.ts`

```typescript
// 需要认证

// 请求体
{
  "choice": "主胜"  // 或 "平局" / "客胜"
}

// 验证流程
1. 比赛存在性检查
2. 比赛状态检查 (status = "未开始")
3. 防重复提交: SELECT id FROM user_guess WHERE match_id = ? AND user_id = ?
4. 插入竞猜记录
5. 更新投票统计

// 返回 (200)
{
  "code": 200,
  "message": "竞猜成功"
}
```

---

## 7️⃣ Admin 管理员 API 模式

### 通用认证检查
```typescript
const admin = getAdminFromRequest(request);
if (!admin) {
  return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
}
```

### 示例: POST /api/admin/matches

```typescript
// 请求体
{
  "home_team_id": 1,
  "away_team_id": 2,
  "home_score": 0,
  "away_score": 0,
  "status": "未开始",
  "match_time": "14:00",
  "match_date": "2026-06-01",
  "stage": "小组赛",
  "group_name": "A"  // 可选
}

// 执行INSERT
await execute(
  `INSERT INTO matches_ 
   (home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [home_team_id, away_team_id, home_score || 0, away_score || 0, status || "未开始", match_time, match_date, stage, group_name || null]
);
```

---

## 8️⃣ 重要数据库表速查

### 用户相关
- **users**: id, nickname, password, openid, avatar_url, points, created_at
- **user_follows**: id, user_id, team_id, created_at
- **user_guess**: id, match_id, user_id, user_choose, is_right, create_time

### 比赛相关
- **matches_**: id, home_team_id, away_team_id, home_score, away_score, status, match_time, match_date, stage, group_name
- **match_vote**: id, match_id, vote_home, vote_draw, vote_away, final_result

### 其他
- **teams**: id, name, flag_url, continent, world_cup_appearances, best_result, coach
- **players**: id, name, photo_url, team_id, birth_date, height, position, club, goals, assists

---

## 9️⃣ 常用代码片段

### 添加新的 POST API
```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { field1, field2 } = await request.json();
    
    if (!field1) {
      return NextResponse.json({ code: 400, message: "field1不能为空" }, { status: 400 });
    }

    // 检查重复
    const existing = await query(
      "SELECT id FROM table_name WHERE user_id = ? AND field1 = ?",
      [user.id, field1]
    );
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "已存在" }, { status: 400 });
    }

    // 执行操作
    const result = await execute(
      "INSERT INTO table_name (user_id, field1, field2) VALUES (?, ?, ?)",
      [user.id, field1, field2]
    );

    return NextResponse.json({
      code: 200,
      message: "成功",
      data: { id: result.insertId }
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 参数化查询 (防SQL注入)
```typescript
// ✅ 正确做法
const users = await query("SELECT * FROM users WHERE id = ?", [userId]);

// ❌ 错误做法 (容易被SQL注入)
const users = await query(`SELECT * FROM users WHERE id = ${userId}`);
```

---

## 🔟 TODO 和已知问题

### ⚠️ 必须处理的问题

1. **users表缺少字段**
   ```sql
   ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE DEFAULT NULL;
   ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;
   ```

2. **wechat-login 依赖 openid 字段**
   - 需要先执行上面的迁移

3. **微信小程序配置**
   - 验证 WX_APPID 和 WX_SECRET 是否有效
   - 测试 mock 登录功能

---

## 总结

✅ **项目架构清晰** - 分层明确 (DB → Auth → Routes)  
✅ **参数化查询** - 防SQL注入  
✅ **JWT认证** - 用户7天 / 管理员24小时  
✅ **统一响应格式** - code + message + data  
✅ **错误处理完善** - 隐藏内部错误信息  

要添加新功能，按照现有模式即可！
