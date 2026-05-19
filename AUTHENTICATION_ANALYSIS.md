# Cupflow 后端项目 - 用户认证系统完整分析

**项目位置**: `/Users/zhanghongyan/ReactProjects/cupflow-backend`
**项目类型**: Next.js 14 + TypeScript 全栈应用
**数据库**: MySQL (utf8mb4)
**认证方案**: JWT + bcryptjs

---

## 📋 目录

1. [用户表结构](#用户表结构)
2. [认证路由](#认证路由)
3. [JWT 实现](#jwt-实现)
4. [微信登录](#微信登录)
5. [用户模型](#用户模型)
6. [API 路由组织](#api-路由组织)
7. [关键文件清单](#关键文件清单)

---

## 用户表结构

### 主表: `users`

**SQL 定义** (`src/scripts/init-db.ts` L98-104):
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户唯一自增ID',
  nickname VARCHAR(50) NOT NULL UNIQUE COMMENT '用户专属昵称',
  password VARCHAR(255) NOT NULL COMMENT '用户密码',
  points INT DEFAULT 0 COMMENT '用户竞猜累计积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '用户账号注册时间'
) COMMENT='网站前台用户信息表'
```

**字段说明**:
| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| `id` | INT | 自增主键 | PRIMARY KEY, AUTO_INCREMENT |
| `nickname` | VARCHAR(50) | 用户昵称 | NOT NULL, UNIQUE |
| `password` | VARCHAR(255) | 加密密码 | NOT NULL |
| `points` | INT | 竞猜积分 | DEFAULT 0 |
| `created_at` | TIMESTAMP | 注册时间 | DEFAULT CURRENT_TIMESTAMP |

**关键特性**:
- ✅ 昵称唯一性约束（UNIQUE）
- ✅ 密码采用 bcryptjs 加密（10轮盐）
- ✅ 默认积分 0 分
- ✅ 自动记录注册时间
- ⚠️ 没有头像字段
- ⚠️ 没有邮箱字段

### 相关表: `user_follows`

```sql
CREATE TABLE IF NOT EXISTS user_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '关注操作用户ID',
  team_id INT NOT NULL COMMENT '被关注球队ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='用户关注喜爱球队关联表'
```

关系: `users` (1) ──── (N) `user_follows` ──── (N) `teams`

### 相关表: `user_guess`

```sql
CREATE TABLE IF NOT EXISTS user_guess (
  id INT PRIMARY KEY AUTO_INCREMENT,
  match_id INT NOT NULL,
  user_id INT NOT NULL COMMENT '参与竞猜的用户ID',
  user_choose VARCHAR(20) NOT NULL COMMENT '用户竞猜选择：主胜/平局/客胜',
  is_right TINYINT DEFAULT NULL COMMENT '结果判定：1猜对 0猜错 NULL未结算',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='登录用户赛事竞猜个人记录表'
```

---

## 认证路由

### 1️⃣ 用户登录 - `POST /api/user/login`

**文件**: `src/app/api/user/login/route.ts`

**功能**: 用户登录获取 JWT Token

```typescript
// 请求
{
  "nickname": "string",      // 用户昵称
  "password": "string"       // 密码
}

// 响应 (成功)
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",    // JWT Token (7天有效期)
    "userId": 1,
    "nickname": "user123",
    "points": 100
  }
}

// 错误响应
{
  "code": 401,
  "message": "昵称或密码错误"
}
```

**验证流程**:
1. 检查昵称和密码不为空
2. 查询 `users` 表找用户
3. 用 `bcrypt.compare()` 验证密码
4. 签发 JWT Token

**关键代码**:
```typescript
const users = await query<any>("SELECT * FROM users WHERE nickname = ?", [nickname]);
const isValid = await comparePassword(password, user.password);
const token = signUserToken({ id: user.id, nickname: user.nickname });
```

---

### 2️⃣ 用户注册 - `POST /api/user/register`

**文件**: `src/app/api/user/register/route.ts`

**功能**: 用户注册新账户

```typescript
// 请求
{
  "nickname": "string",      // 2-20 字符
  "password": "string"       // 至少 6 位
}

// 响应 (成功)
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGc...",    // 立即登录
    "userId": 1,
    "nickname": "user123"
  }
}

// 错误响应
{
  "code": 400,
  "message": "该昵称已被注册"  // 或其他验证错误
}
```

**验证规则**:
- 昵称长度: 2-20 字符
- 密码长度: 至少 6 位
- 昵称唯一性: 检查重复

**关键代码**:
```typescript
const hashedPwd = await hashPassword(password);
const result = await execute(
  "INSERT INTO users (nickname, password) VALUES (?, ?)",
  [nickname, hashedPwd]
);
const token = signUserToken({ id: result.insertId, nickname });
```

---

### 3️⃣ 用户资料 - `GET /api/user/profile`

**文件**: `src/app/api/user/profile/route.ts`

**功能**: 获取当前登录用户的详细信息

```typescript
// 请求 (带 Token)
GET /api/user/profile
Authorization: Bearer eyJhbGc...

// 响应
{
  "code": 200,
  "data": {
    "id": 1,
    "nickname": "user123",
    "points": 150,
    "created_at": "2024-05-18...",
    "rank": 5,                      // 计算得出的排名
    "guesses": [                    // 竞猜历史
      {
        "id": 1,
        "match_id": 10,
        "user_choose": "主胜",
        "is_right": 1,              // 1=猜对, 0=猜错, null=未结算
        "create_time": "2024-05-18...",
        "home_team_name": "巴西",
        "away_team_name": "法国",
        "home_score": 2,
        "away_score": 1,
        "stage": "决赛"
      }
      // ...更多竞猜记录
    ],
    "follows": [                    // 关注的球队
      {
        "id": 1,
        "team_id": 1,
        "name": "巴西",
        "flag_url": "..."
      }
      // ...更多关注
    ]
  }
}
```

**权限**: 需要有效的用户 Token

**关键查询**:
- 用户基本信息
- 实时排名计算: `COUNT(*) WHERE points > user.points + 1`
- 竞猜历史（3表联接）
- 关注球队列表

---

### 4️⃣ 用户关注 - `GET/POST/DELETE /api/user/follows`

**文件**: `src/app/api/user/follows/route.ts`

#### GET - 获取关注列表
```typescript
// 获取用户所有关注的球队
GET /api/user/follows

// 响应
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "team_id": 1,
      "name": "巴西",
      "flag_url": "...",
      "continent": "南美洲"
    },
    // ...更多
  ]
}
```

#### POST - 添加关注
```typescript
// 关注一个球队
POST /api/user/follows
{
  "teamId": 1
}

// 响应
{
  "code": 200,
  "message": "关注成功"
}
```

#### DELETE - 取消关注
```typescript
// 取消关注
DELETE /api/user/follows?teamId=1

// 响应
{
  "code": 200,
  "message": "取消关注成功"
}
```

---

### 5️⃣ 管理员登录 - `POST /api/auth/login`

**文件**: `src/app/api/auth/login/route.ts`

**功能**: 管理员后台登录

```typescript
// 请求
{
  "username": "admin",
  "password": "admin123"
}

// 响应
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc..."       // 24小时有效期
  }
}

// 同时设置 Cookie:
// admin_token = token (httpOnly, maxAge: 86400)
```

**特点**:
- Token 存储在 HttpOnly Cookie
- 有效期 24 小时
- CSRF 风险（无 CSRF Token）

---

### 6️⃣ 管理员登出 - `POST /api/auth/logout`

**文件**: `src/app/api/auth/logout/route.ts`

```typescript
// 请求
POST /api/auth/logout

// 响应
{
  "code": 200,
  "message": "退出成功"
}

// 清除 Cookie:
// admin_token = "" (maxAge: 0)
```

---

## JWT 实现

### 核心文件: `src/lib/auth.ts`

#### 1. 密钥配置

```typescript
const ADMIN_SECRET = process.env.JWT_SECRET || "cupflow_admin_secret_key_2026";
const USER_SECRET = process.env.JWT_USER_SECRET || "cupflow_user_secret_key_2026";
```

**⚠️ 安全问题**:
- 密钥是可预测的字符串
- 应使用强随机密钥
- 建议长度 32+ 字符

#### 2. 签名 (签发 Token)

```typescript
// 管理员 Token
export function signAdminToken(payload: { id: number; username: string }) {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: "24h" });
}

// 用户 Token  
export function signUserToken(payload: { id: number; nickname: string }) {
  return jwt.sign(payload, USER_SECRET, { expiresIn: "7d" });
}
```

**有效期**:
- Admin: 24 小时
- User: 7 天

#### 3. 验证 (解析 Token)

```typescript
export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, ADMIN_SECRET) as { id: number; username: string };
  } catch {
    return null;  // 验证失败返回 null
  }
}

export function verifyUserToken(token: string) {
  try {
    return jwt.verify(token, USER_SECRET) as { id: number; nickname: string };
  } catch {
    return null;
  }
}
```

#### 4. 从请求提取 Token

```typescript
export function getAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);  // 移除 "Bearer " 前缀
  return verifyAdminToken(token);
}

export function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyUserToken(token);
}
```

**Token 格式**: `Authorization: Bearer <token>`

#### 5. 密码加密

```typescript
// 密码加密 (10轮盐)
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// 密码验证
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

---

## 微信登录

### 状态: ❌ 未实现

**发现**:
```bash
$ grep -r "weixin\|wechat\|微信" src --include="*.ts" --include="*.tsx"
# (无结果)
```

**结论**: 
- 当前项目中没有微信登录相关代码
- 只有传统的账号密码认证
- 可以作为未来功能扩展

---

## 用户模型

### 用户数据结构

从 `users` 表和 API 响应看，用户模型包括:

```typescript
interface User {
  // 基本信息
  id: number;                    // 用户 ID
  nickname: string;              // 昵称（唯一）
  password: string;              // 密码哈希值
  
  // 游戏数据
  points: number;                // 竞猜积分
  rank?: number;                 // 实时排名（计算得出）
  
  // 元数据
  created_at: string;            // 注册时间
  
  // 关联数据
  guesses?: UserGuess[];         // 竞猜历史
  follows?: TeamFollow[];        // 关注球队
}

interface UserGuess {
  id: number;
  match_id: number;
  user_choose: "主胜" | "平局" | "客胜";
  is_right: 1 | 0 | null;
  create_time: string;
  // ... 关联的比赛信息
}

interface TeamFollow {
  id: number;
  team_id: number;
  name: string;
  flag_url: string;
  continent: string;
}
```

### 字段缺失

⚠️ **当前没有的字段**:
- ❌ 头像 URL
- ❌ 邮箱
- ❌ 手机号
- ❌ 性别
- ❌ 城市
- ❌ 个人签名
- ❌ VIP 状态

---

## API 路由组织

### 目录结构

```
src/app/
├── api/                          # API 路由根目录
│   ├── auth/                     # 管理员认证
│   │   ├── login/
│   │   │   └── route.ts         # POST /api/auth/login
│   │   └── logout/
│   │       └── route.ts         # POST /api/auth/logout
│   │
│   ├── user/                     # 用户认证与管理
│   │   ├── login/
│   │   │   └── route.ts         # POST /api/user/login
│   │   ├── register/
│   │   │   └── route.ts         # POST /api/user/register
│   │   ├── profile/
│   │   │   └── route.ts         # GET /api/user/profile
│   │   └── follows/
│   │       └── route.ts         # GET/POST/DELETE /api/user/follows
│   │
│   ├── admin/                    # 管理员操作 API
│   │   ├── users/               # 用户管理
│   │   │   ├── route.ts         # GET /api/admin/users
│   │   │   └── [id]/route.ts    # DELETE /api/admin/users/[id]
│   │   ├── matches/
│   │   ├── teams/
│   │   ├── players/
│   │   ├── news/
│   │   ├── highlights/
│   │   ├── live/
│   │   └── comments/
│   │
│   ├── matches/                  # 赛事数据
│   ├── teams/                    # 球队数据
│   ├── players/                  # 球员数据
│   ├── news/                     # 新闻资讯
│   ├── comments/                 # 评论系统
│   ├── live/                     # 直播评论
│   ├── highlights/               # 比赛集锦
│   ├── guess/                    # 用户竞猜
│   ├── vote/                     # 投票系统
│   ├── rank/                     # 排名系统
│   └── comment-like/             # 点赞系统
```

### 路由设计模式

**Next.js App Router 约定**:
- 每个目录的 `route.ts` 是该路由的处理器
- `[param]` 用于动态参数
- 支持多个 HTTP 方法: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, etc.

**示例 - 用户登录**:
```
文件: src/app/api/user/login/route.ts
路由: POST /api/user/login
```

**示例 - 删除用户**:
```
文件: src/app/api/admin/users/[id]/route.ts
路由: DELETE /api/admin/users/{id}
```

---

## 中间件保护

**文件**: `src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  // 管理后台路由保护
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // API CORS 预检
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
```

---

## 关键文件清单

### 认证相关

| 文件 | 说明 |
|------|------|
| `src/lib/auth.ts` | JWT 签名、验证、密码加密 - **核心认证逻辑** |
| `src/app/api/user/login/route.ts` | 用户登录 API |
| `src/app/api/user/register/route.ts` | 用户注册 API |
| `src/app/api/user/profile/route.ts` | 用户资料 API |
| `src/app/api/user/follows/route.ts` | 用户关注管理 API |
| `src/app/api/auth/login/route.ts` | 管理员登录 API |
| `src/app/api/auth/logout/route.ts` | 管理员登出 API |
| `src/middleware.ts` | 路由保护和 CORS 中间件 |

### 数据库相关

| 文件 | 说明 |
|------|------|
| `src/lib/db.ts` | MySQL 连接池和查询方法 |
| `src/scripts/init-db.ts` | **数据库初始化脚本** |

### 用户管理

| 文件 | 说明 |
|------|------|
| `src/app/api/admin/users/route.ts` | 列出所有用户 |
| `src/app/api/admin/users/[id]/route.ts` | 删除用户 |

### 数据库 Schema

| 表名 | 字段数 | 说明 |
|------|--------|------|
| `users` | 5 | 用户账户（昵称、密码、积分） |
| `user_follows` | 4 | 用户关注关系 |
| `user_guess` | 6 | 用户竞猜记录 |
| `admins` | 4 | 管理员账户 |

---

## 数据库初始化

**命令**:
```bash
npm run db:init
# 等价于: npx tsx src/scripts/init-db.ts
```

**做的事情**:
1. 创建数据库 `cupflow` (utf8mb4)
2. 创建 12 个表
3. 插入默认管理员 `admin/admin123`

**关键代码** (`src/scripts/init-db.ts` L162-167):
```typescript
const hashedPassword = await bcrypt.hash("admin123", 10);
await connection.execute(
  "INSERT IGNORE INTO admins (username, password) VALUES (?, ?)",
  ["admin", hashedPassword]
);
```

---

## 安全分析

### ✅ 安全的地方

1. **密码加密**: 使用 bcryptjs (10轮盐)
2. **参数化查询**: 所有数据库查询使用参数绑定
3. **Token 验证**: JWT 签名和验证
4. **HttpOnly Cookie**: 管理员 Token 设置 HttpOnly 标志

### ⚠️ 需要改进的地方

1. **硬编码凭证**: 数据库密码在 `src/lib/db.ts` 中硬编码
2. **弱默认密钥**: JWT 密钥是可预测的字符串
3. **缺少速率限制**: API 无速率限制，容易被暴力破解
4. **缺少 CSRF 保护**: 管理员接口可能容易受 CSRF 攻击
5. **广泛 CORS**: 允许所有来源 (`Access-Control-Allow-Origin: *`)
6. **缺少日志**: 没有认证失败日志

---

## 使用场景示例

### 前端集成示例 (JavaScript/Vue/React)

```javascript
// 用户注册
const register = async (nickname, password) => {
  const res = await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password })
  });
  const data = await res.json();
  if (data.code === 200) {
    localStorage.setItem('token', data.data.token);
    return data.data;
  }
};

// 用户登录
const login = async (nickname, password) => {
  const res = await fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, password })
  });
  const data = await res.json();
  if (data.code === 200) {
    localStorage.setItem('token', data.data.token);
    return data.data;
  }
};

// 获取用户资料
const getProfile = async (token) => {
  const res = await fetch('/api/user/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await res.json();
};

// 关注球队
const followTeam = async (token, teamId) => {
  const res = await fetch('/api/user/follows', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ teamId })
  });
  return await res.json();
};
```

---

**最后更新**: 2026-05-19
**分析工具**: 手动代码审查
