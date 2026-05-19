# 🔐 Cupflow 认证系统 - 项目文档总览

> **最后更新**: 2026-05-19 | **项目位置**: `/Users/zhanghongyan/ReactProjects/cupflow-backend`

---

## 📚 文档导航

本项目提供了完整的认证系统文档，包括 4 个关键文件：

### 1. 📖 **AUTHENTICATION_ANALYSIS.md** (17 KB)
**→ 最详细的分析文档**

详细的认证系统完整分析，包括：
- ✅ 用户表结构详细说明
- ✅ 6 个核心 API 端点完整说明
- ✅ JWT 实现原理和密钥管理
- ✅ 用户数据模型和字段定义
- ✅ API 路由组织结构
- ✅ 中间件保护机制
- ✅ 关键文件清单和位置
- ✅ 数据库初始化过程
- ✅ 安全分析（优缺点）
- ✅ 前端集成示例代码

**适合场景**: 全面理解系统架构、深入学习

---

### 2. ⚡ **AUTH_QUICK_REF.md** (4.2 KB)
**→ 快速参考卡**

简洁实用的快速查阅卡，包括：
- 📍 核心文件位置地图
- 🔐 数据库表速查
- 🔑 JWT 密钥配置
- 🚀 API 端点表格速查
- 🔒 认证方式速查
- 📝 响应格式标准
- 🗝️ 关键函数列表
- ⚠️ 注意事项
- 🔧 常见操作命令

**适合场景**: 快速查询、开发时参考

---

### 3. 📝 **CODE_SNIPPETS.md** (15 KB)
**→ 代码片段参考**

可直接使用的完整代码实现，包括：
- ✅ 核心认证文件 `src/lib/auth.ts` 完整代码
- ✅ 用户注册 API 完整实现
- ✅ 用户登录 API 完整实现
- ✅ 用户资料 API 完整实现
- ✅ 管理员认证 API 完整实现
- ✅ 用户关注管理 API 完整实现
- ✅ 中间件保护完整代码
- ✅ 前端调用示例（TypeScript 客户端类）

**适合场景**: 复制粘贴、学习实现细节、扩展功能

---

### 4. 📊 **DATABASE_SCHEMA.md** (9.2 KB)
**→ 数据库文档**

原有的数据库 Schema 文档（项目附带），包括：
- 13 个表的完整定义
- SQL 语句
- 字段说明
- 关键关系图

**适合场景**: 数据库设计理解、SQL 查询编写

---

## 🎯 使用指南

### 我应该读哪个文档？

| 你的需求 | 推荐文档 |
|---------|--------|
| 快速查询某个 API 端点 | ⚡ AUTH_QUICK_REF.md |
| 理解认证系统整体设计 | 📖 AUTHENTICATION_ANALYSIS.md |
| 复制代码进行开发 | 📝 CODE_SNIPPETS.md |
| 编写 SQL 查询 | 📊 DATABASE_SCHEMA.md |
| 从零开始学习 | 📖 → 📝 → ⚡ |

---

## 🔍 快速查找

### API 端点
```
用户相关:
  POST   /api/user/register        → AUTH_QUICK_REF.md 表格
  POST   /api/user/login           → AUTH_QUICK_REF.md 表格
  GET    /api/user/profile         → AUTHENTICATION_ANALYSIS.md 第3️⃣节
  GET/POST/DELETE /api/user/follows → AUTHENTICATION_ANALYSIS.md 第4️⃣节

管理员相关:
  POST   /api/auth/login           → AUTHENTICATION_ANALYSIS.md 第5️⃣节
  POST   /api/auth/logout          → AUTHENTICATION_ANALYSIS.md 第6️⃣节
```

### 数据库表
```
主表:
  users             → DATABASE_SCHEMA.md
  admins            → DATABASE_SCHEMA.md

关联表:
  user_follows      → DATABASE_SCHEMA.md
  user_guess        → DATABASE_SCHEMA.md
```

### 关键文件
```
认证核心:
  src/lib/auth.ts   → CODE_SNIPPETS.md (完整代码)

API 实现:
  src/app/api/user/login/route.ts      → CODE_SNIPPETS.md
  src/app/api/user/register/route.ts   → CODE_SNIPPETS.md
  src/app/api/user/profile/route.ts    → CODE_SNIPPETS.md
```

---

## 🚀 常见任务快速开始

### 任务 1: 集成前端登录功能

**步骤**:
1. 查看 CODE_SNIPPETS.md 中的 "前端调用示例"
2. 参考 AUTHENTICATION_ANALYSIS.md 第2️⃣节的 API 规范
3. 使用提供的 AuthClient 类

**关键代码**:
```typescript
const auth = new AuthClient();
const result = await auth.loginUser("user123", "password123");
if (result.code === 200) {
  const token = result.data.token;
  localStorage.setItem("userToken", token);
}
```

---

### 任务 2: 添加新的 API 端点需要认证

**步骤**:
1. 在 CODE_SNIPPETS.md 中找到类似的 API 实现
2. 参考 AUTHENTICATION_ANALYSIS.md 中的"权限"部分
3. 在路由开始使用 `getUserFromRequest()` 或 `getAdminFromRequest()`

**关键代码**:
```typescript
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }
  // ... 你的业务逻辑
}
```

---

### 任务 3: 修改 JWT 密钥

**步骤**:
1. 编辑 `.env` 文件或设置环境变量
2. 参考 AUTH_QUICK_REF.md 中的"JWT 密钥"部分

**可设置的环境变量**:
```env
JWT_SECRET=your_admin_secret_key_here
JWT_USER_SECRET=your_user_secret_key_here
```

---

### 任务 4: 初始化数据库

**步骤**:
1. 参考 AUTH_QUICK_REF.md 中的"常见操作"
2. 运行命令: `npm run db:init`

**默认结果**:
- 创建 `cupflow` 数据库
- 创建 12 个表
- 创建管理员账户 `admin / admin123`

---

## 📋 项目信息速览

| 项 | 值 |
|----|-----|
| **项目名** | cupflow-backend |
| **框架** | Next.js 14.2.15 |
| **语言** | TypeScript 5.6.2 |
| **数据库** | MySQL (utf8mb4) |
| **认证方式** | JWT + bcryptjs |
| **Token 类型** | 两个独立密钥（管理员/用户） |
| **管理员 Token 有效期** | 24 小时 |
| **用户 Token 有效期** | 7 天 |
| **密码加密** | bcryptjs (salt: 10) |
| **数据库连接** | mysql2/promise 连接池 |

---

## 🔐 核心认证方案

### JWT 结构

```typescript
// 用户 Token 包含
{ id: number, nickname: string }

// 管理员 Token 包含  
{ id: number, username: string }
```

### Token 验证流程

```
请求 → 提取 Authorization header
    → 移除 "Bearer " 前缀
    → 用 jwt.verify() 验证签名
    → 返回 payload 或 null
```

### 密码加密

```
原始密码 → bcrypt.hash(password, 10) → 存储哈希值
验证时 → bcrypt.compare(输入密码, 存储的哈希值) → true/false
```

---

## ⚠️ 注意事项

### 关键限制

- ✅ 用户昵称必须唯一
- ✅ 密码最少 6 位
- ✅ 昵称长度 2-20 字符
- ❌ 用户表中没有头像字段
- ❌ 用户表中没有邮箱字段
- ❌ **没有微信登录实现**

### 安全提醒

⚠️ 生产环境需要改进的地方:
1. JWT 密钥应该使用强随机字符串
2. 数据库凭证应该使用环境变量
3. 需要添加速率限制防止暴力破解
4. 需要添加 CSRF 保护
5. 需要限制 CORS 来源（不是 `*`）
6. 应该添加认证失败日志

---

## 📞 如何快速找到某个功能

### 我想知道如何...

**...用户注册?**
- 快速查看: AUTH_QUICK_REF.md (表格)
- 细节: AUTHENTICATION_ANALYSIS.md 第2️⃣节
- 代码: CODE_SNIPPETS.md "POST /api/user/register"

**...生成 JWT Token?**
- 代码: CODE_SNIPPETS.md "src/lib/auth.ts"
- 细节: AUTHENTICATION_ANALYSIS.md "JWT 实现"

**...保护一个 API 端点?**
- 步骤: AUTHENTICATION_ANALYSIS.md "关键文件清单"
- 代码: CODE_SNIPPETS.md "中间件保护"

**...从前端调用 API?**
- 完整示例: CODE_SNIPPETS.md "前端调用示例"

**...修改用户表?**
- 查看: DATABASE_SCHEMA.md "users 表"

---

## 📞 支持

如果你有问题:

1. **API 问题**: 查看 AUTHENTICATION_ANALYSIS.md 的相应 API 节
2. **代码问题**: 查看 CODE_SNIPPETS.md
3. **数据库问题**: 查看 DATABASE_SCHEMA.md
4. **快速查询**: 使用 AUTH_QUICK_REF.md

---

## ✅ 文档清单

- [x] AUTHENTICATION_ANALYSIS.md - 详细分析（17 KB）
- [x] AUTH_QUICK_REF.md - 快速参考（4.2 KB）
- [x] CODE_SNIPPETS.md - 代码片段（15 KB）
- [x] DATABASE_SCHEMA.md - 数据库文档（9.2 KB）
- [x] AUTHENTICATION_OVERVIEW.md - 本文档（总览）

**总文档大小**: 约 45+ KB 的完整认证文档

---

## 📝 版本信息

| 文档 | 版本 | 更新日期 |
|------|------|---------|
| AUTHENTICATION_ANALYSIS.md | 1.0 | 2026-05-19 |
| AUTH_QUICK_REF.md | 1.0 | 2026-05-19 |
| CODE_SNIPPETS.md | 1.0 | 2026-05-19 |
| AUTHENTICATION_OVERVIEW.md | 1.0 | 2026-05-19 |

---

**🎉 项目认证系统文档已完成！**

所有文档都已保存在项目根目录中，可随时查阅。
