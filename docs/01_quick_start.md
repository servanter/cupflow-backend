# ⚡ CupFlow 快速启动 & 核心参考

## 🚀 启动项目

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库（创建所有表 + 默认管理员）
npm run db:init

# 3. 启动开发服务器
npm run dev
# 访问: http://localhost:3000
```

**生产部署**:
```bash
npm run build && npm start
```

---

## 🔑 默认凭证

| 类型 | 账号 | 密码 |
|------|------|------|
| 管理员 | `admin` | 见 `.env` 或联系管理员 |
| 数据库 | 见 `.env` 文件配置 |

> ⚠️ 生产环境请务必修改以上凭证，并使用 `.env` 文件管理

---

## 📂 关键文件速查

```
src/
├── lib/
│   ├── auth.ts          ← JWT 签名/验证、密码加密（核心）
│   └── db.ts            ← 数据库连接池
├── app/api/
│   ├── user/
│   │   ├── login/       ← POST /api/user/login
│   │   ├── register/    ← POST /api/user/register
│   │   ├── profile/     ← GET /api/user/profile
│   │   ├── follows/     ← GET/POST/DELETE /api/user/follows
│   │   ├── avatar/      ← POST /api/user/avatar/upload
│   │   └── wechat-login/← POST /api/user/wechat-login
│   ├── auth/
│   │   ├── login/       ← POST /api/auth/login（管理员）
│   │   └── logout/      ← POST /api/auth/logout
│   └── admin/users/     ← 用户管理 API
├── middleware.ts         ← 路由保护和 CORS
└── scripts/
    └── init-db.ts        ← 数据库初始化
```

---

## 🔐 认证系统速查

### JWT Token

| 类型 | 有效期 | Secret 环境变量 | Payload |
|------|--------|----------------|---------|
| 用户 Token | 7 天 | `JWT_USER_SECRET` | `{ id, nickname }` |
| 管理员 Token | 24 小时 | `JWT_SECRET` | `{ id, username }` |

**请求头格式**: `Authorization: Bearer <token>`

### 核心函数（`src/lib/auth.ts`）

```typescript
// 生成 Token
signUserToken({ id, nickname })     // 用户 Token（7天）
signAdminToken({ id, username })    // 管理员 Token（24h）

// 验证 Token
verifyUserToken(token)              // 返回 payload 或 null
verifyAdminToken(token)             // 返回 payload 或 null

// 从请求提取身份
getUserFromRequest(request)         // 返回 { id, nickname } 或 null
getAdminFromRequest(request)        // 返回 { id, username } 或 null

// 密码处理
hashPassword(password)              // bcrypt 加密（10轮 salt）
comparePassword(password, hash)     // 验证密码
```

---

## 📊 数据库操作速查

```typescript
import { query, execute } from "@/lib/db";

// SELECT → 返回数组
const users = await query<any>("SELECT * FROM users WHERE id = ?", [id]);
const user = users[0]; // 取第一条

// INSERT/UPDATE/DELETE → 返回 ResultSetHeader
const result = await execute("INSERT INTO users (nickname, password) VALUES (?, ?)", [nick, pwd]);
const newId = result.insertId;       // 新记录 ID
const rows = result.affectedRows;    // 影响行数
```

---

## 🏗️ 新建 API 的 3 步流程

### 第 1 步：创建文件
```
src/app/api/[模块]/[功能]/route.ts
```

### 第 2 步：填入标准骨架
```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 1. 认证
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

    // 2. 参数验证
    const { fieldName } = await request.json();
    if (!fieldName) return NextResponse.json({ code: 400, message: "参数错误" }, { status: 400 });

    // 3. 业务逻辑
    await execute("INSERT INTO table (user_id, field) VALUES (?, ?)", [user.id, fieldName]);

    // 4. 返回成功
    return NextResponse.json({ code: 200, message: "成功", data: {} });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 第 3 步：测试
```bash
curl -X POST http://localhost:3000/api/user/new-feature \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fieldName": "value"}'
```

---

## 📝 标准响应格式

```typescript
// 成功
{ code: 200, message: "成功", data: { ... } }

// 错误
{ code: 400, message: "参数错误" }   // 参数问题
{ code: 401, message: "未登录" }     // 认证失败
{ code: 404, message: "不存在" }     // 资源不存在
{ code: 500, message: "服务器内部错误" } // 服务器异常
```

---

## ⚠️ 常见错误避坑

```typescript
// ❌ 错误：字符串拼接 SQL（SQL 注入风险）
const sql = `SELECT * FROM users WHERE id = ${id}`;

// ✅ 正确：参数化查询
const sql = "SELECT * FROM users WHERE id = ?";
await query(sql, [id]);

// ❌ 错误：表名写错（matches 不存在）
"SELECT * FROM matches"

// ✅ 正确
"SELECT * FROM matches_"

// ❌ 错误：不验证 user 就使用
const user = getUserFromRequest(request);
const id = user.id; // 可能崩溃

// ✅ 正确
const user = getUserFromRequest(request);
if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
```

---

## 🔧 环境变量参考（`.env`）

```env
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cupflow

JWT_SECRET=your_admin_jwt_secret
JWT_USER_SECRET=your_user_jwt_secret

WX_APPID=your_wx_appid
WX_SECRET=your_wx_secret
```

---

## 🐛 调试技巧

- **数据库连接问题**: 运行 `npm run db:init` 验证连接
- **Token 问题**: 检查 `Authorization: Bearer <token>` 格式
- **微信登录 Mock**: 传 `code: "mock"` 可在开发环境跳过微信验证
- **查看服务端日志**: 终端输出 / `console.error` 信息

---

## 🚨 上线前安全检查

1. 将数据库密码移入环境变量
2. 修改默认管理员密码
3. 使用强随机 JWT 密钥（32+ 字符）
4. 限制 CORS 来源（当前为 `*`）
5. 添加 API 速率限制
6. 启用 HTTPS
