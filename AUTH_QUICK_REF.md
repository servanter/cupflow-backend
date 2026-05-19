# 认证系统快速参考卡

## 📍 核心文件位置

```
src/
├── lib/
│   ├── auth.ts              ← JWT 签名/验证、密码加密（核心）
│   └── db.ts                ← 数据库连接池
├── app/api/
│   ├── user/
│   │   ├── login/           ← POST /api/user/login
│   │   ├── register/        ← POST /api/user/register  
│   │   ├── profile/         ← GET /api/user/profile
│   │   └── follows/         ← GET/POST/DELETE /api/user/follows
│   ├── auth/
│   │   ├── login/           ← POST /api/auth/login (管理员)
│   │   └── logout/          ← POST /api/auth/logout
│   └── admin/users/         ← 用户管理 API
├── middleware.ts            ← 路由保护和 CORS
└── scripts/
    └── init-db.ts           ← 数据库初始化

DATABASE_SCHEMA.md           ← 数据库文档
AUTHENTICATION_ANALYSIS.md   ← 详细分析（本文档）
```

## 🔐 数据库表

### users (用户账户)
```sql
id              INT PK
nickname        VARCHAR(50) UNIQUE ← 用户名  
password        VARCHAR(255)       ← bcryptjs 加密
points          INT DEFAULT 0      ← 竞猜积分
created_at      TIMESTAMP
```

### admins (管理员)
```sql
id              INT PK
username        VARCHAR(50) UNIQUE ← 用户名
password        VARCHAR(255)       ← bcryptjs 加密
created_at      TIMESTAMP
```

### user_follows / user_guess
记录用户关注的球队和竞猜历史

## 🔑 JWT 密钥

```typescript
// src/lib/auth.ts
const ADMIN_SECRET = process.env.JWT_SECRET 
  || "cupflow_admin_secret_key_2026";
const USER_SECRET = process.env.JWT_USER_SECRET 
  || "cupflow_user_secret_key_2026";
```

**有效期**:
- Admin Token: 24 小时
- User Token: 7 天

## 🚀 API 端点速查

| 方法 | 路由 | 功能 | Auth |
|------|------|------|------|
| POST | `/api/user/register` | 用户注册 | ❌ |
| POST | `/api/user/login` | 用户登录 | ❌ |
| GET | `/api/user/profile` | 获取资料 | ✅ User |
| GET/POST/DELETE | `/api/user/follows` | 管理关注 | ✅ User |
| POST | `/api/auth/login` | 管理员登录 | ❌ |
| POST | `/api/auth/logout` | 管理员登出 | ✅ Admin |
| GET | `/api/admin/users` | 用户列表 | ✅ Admin |
| DELETE | `/api/admin/users/[id]` | 删除用户 | ✅ Admin |

## 🔒 认证方式

### 用户认证
```
Header: Authorization: Bearer <user_token>
Token 由 signUserToken() 生成，包含: { id, nickname }
验证函数: verifyUserToken()
```

### 管理员认证
```
两种方式:
1. Header: Authorization: Bearer <admin_token>
2. Cookie: admin_token=<token> (httpOnly, 24h)
Token 由 signAdminToken() 生成，包含: { id, username }
验证函数: verifyAdminToken()
```

## 📝 API 响应格式

```typescript
{
  code: 200,           // 状态码 (200/400/401/404/500)
  message?: string,    // 可选消息
  data?: any          // 可选数据
}
```

## 🗝️ 密钥函数 (src/lib/auth.ts)

```typescript
// 密码操作
hashPassword(password)              // 加密密码 (bcrypt salt: 10)
comparePassword(password, hash)     // 验证密码

// Token 操作
signAdminToken(payload)             // 生成管理员 Token
verifyAdminToken(token)             // 验证管理员 Token
signUserToken(payload)              // 生成用户 Token
verifyUserToken(token)              // 验证用户 Token

// 请求提取
getAdminFromRequest(request)        // 从请求提取管理员信息
getUserFromRequest(request)         // 从请求提取用户信息
```

## ⚠️ 注意事项

- 用户昵称必须唯一
- 密码最少 6 位
- 昵称长度 2-20 字符
- 用户表中没有头像/邮箱字段
- **没有微信登录实现**

## 🔧 常见操作

### 初始化数据库
```bash
npm run db:init
# 默认管理员: admin / admin123
```

### 启动开发服务器
```bash
npm run dev
# 访问: http://localhost:3000
```

## 🔓 默认凭证

```
Admin:
  username: admin
  password: admin123

数据库:
  host: 101.96.207.88:3306
  database: cupflow
  user: root
  password: HONGyan8158
```

⚠️ **安全提醒**: 这些是硬编码的默认值，生产环境应使用环境变量

---

**快速参考卡 v1.0** | 2026-05-19
