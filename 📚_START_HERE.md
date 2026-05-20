# 🎯 CupFlow 后端代码探索 - 从这里开始

> **总计**: 2061 行文档 | **覆盖范围**: 所有关键代码模式 | **深度**: Very Thorough (超级详细)

---

## 📖 快速导航

### 🔰 我是新手，想快速了解项目
**推荐**: `QUICK_REFERENCE.md` (5分钟快速入门)
- 核心概念速查
- 所有API一览表
- 常见错误避坑
- 数据表字段速查

### 🏗️ 我要看完整的项目架构
**推荐**: `CODEBASE_EXPLORATION.md` (20分钟深入了解)
- 项目完整概况
- 数据库连接层详解
- 认证系统详解 (JWT + bcrypt)
- 所有用户API的完整流程
- 竞猜和管理员API参考

### 🔧 我要学习具体的代码实现
**推荐**: `CODE_PATTERNS.md` (30分钟学习代码)
- 10个关键文件的完整代码
- 每个文件的最佳实践标注
- 代码片段复用参考

### 📋 我要快速查看项目统计
**推荐**: `README_EXPLORATION.md` (5分钟了解亮点)
- 探索成果总结
- 已确认的特性清单
- 发现的问题及修复方案

---

## 📂 文档地图

```
📚 项目文档结构
├── 📄 QUICK_REFERENCE.md ⭐⭐⭐
│   └── 快速参考卡片 (最常用!)
│       ├── 核心代码片段
│       ├── 数据表字段
│       ├── API列表表格
│       └── 开发Tips
│
├── 📘 CODEBASE_EXPLORATION.md ⭐⭐⭐⭐
│   └── 完整架构详解 (最详细!)
│       ├── 数据库层 (db.ts)
│       ├── 认证层 (auth.ts)
│       ├── 用户API详解 (8个)
│       ├── 竞猜API
│       └── 管理员API
│
├── 🔧 CODE_PATTERNS.md ⭐⭐⭐⭐
│   └── 完整代码参考 (最全面!)
│       ├── 10个关键文件完整代码
│       ├── 最佳实践标注
│       └── 实际项目示例
│
└── 📋 README_EXPLORATION.md ⭐⭐⭐
    └── 探索成果总结
        ├── 已确认特性清单
        ├── 发现的问题及修复
        ├── 数据库表速查
        └── 使用指南
```

---

## 🎯 按场景选择文档

### 场景1: 我需要快速写一个新API
**步骤**:
1. 打开 `QUICK_REFERENCE.md` → 查看"新建API的3步流程"
2. 打开 `CODE_PATTERNS.md` → 找相似的API代码复制
3. 参考错误处理、参数验证、数据库操作的模式

**预计时间**: 10分钟

### 场景2: 我需要理解某个API的实现细节
**步骤**:
1. 打开 `CODEBASE_EXPLORATION.md` → 第4-5部分找到具体API
2. 查看请求/响应格式
3. 理解验证逻辑和数据库操作

**预计时间**: 5-10分钟

### 场景3: 我需要修改数据库表结构
**步骤**:
1. 打开 `QUICK_REFERENCE.md` → 数据表字段速查
2. 或打开 `README_EXPLORATION.md` → 数据库表全览
3. 查看迁移建议部分

**预计时间**: 5分钟

### 场景4: 我需要学习完整的代码实现
**步骤**:
1. 打开 `CODE_PATTERNS.md` → 按顺序阅读10个关键文件
2. 每个文件都标注了关键特性
3. 理解设计模式和最佳实践

**预计时间**: 30-60分钟

### 场景5: 我需要调试某个问题
**步骤**:
1. 打开 `QUICK_REFERENCE.md` → "常见错误"部分
2. 或打开 `README_EXPLORATION.md` → "已发现的问题"部分
3. 查找相关解决方案

**预计时间**: 5-10分钟

---

## 📊 核心概念速查

### 数据库操作
```typescript
// SELECT
const users = await query<any>("SELECT * FROM users WHERE id = ?", [id]);

// INSERT/UPDATE/DELETE
const result = await execute("INSERT INTO users (nickname, password) VALUES (?, ?)", [nick, pwd]);
// result.insertId - 新记录ID
// result.affectedRows - 受影响行数
```

### 认证流程
```typescript
// 提取用户信息
const user = getUserFromRequest(request);  // { id, nickname } or null

// 生成Token (7天有效)
const token = signUserToken({ id: user.id, nickname: user.nickname });

// 验证密码
const isValid = await comparePassword(inputPassword, storedHash);
```

### API标准结构
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. 认证
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

    // 2. 参数验证
    const { field } = await request.json();
    if (!field) return NextResponse.json({ code: 400, message: "参数错误" }, { status: 400 });

    // 3. 业务逻辑
    await execute("...", [params]);

    // 4. 返回成功
    return NextResponse.json({ code: 200, message: "成功", data: {} });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 🔑 关键信息速查

### JWT Token
- **用户Token**: 7天有效期
- **管理员Token**: 24小时有效期
- **提取方式**: `Authorization: Bearer token`
- **加密**: JWT (不同的Secret)

### 密码处理
- **加密**: bcryptjs (10轮salt)
- **验证**: await comparePassword(input, hash)

### 用户注册验证
- **昵称**: 2-20字符, 必须唯一
- **密码**: 最少6位

### 头像上传限制
- **格式**: jpeg/png/gif/webp
- **大小**: 2MB
- **存储**: `public/uploads/avatars/`
- **URL**: `/uploads/avatars/{userId}_{timestamp}.{ext}`

### 防重复检查
- **竞猜**: 同一用户同一比赛只能竞猜一次
- **关注**: 同一用户同一球队只能关注一次
- **检查方式**: `SELECT id FROM table WHERE user_id = ? AND field = ?`

---

## ⚠️ 已发现的问题及解决方案

### 问题1: users表缺少字段
```sql
-- 执行迁移
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE DEFAULT NULL;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;
```

### 问题2: 微信登录需要openid字段
- 等待上面的迁移完成后可用
- 开发环境支持mock登录 (code = "mock" 或 "the code is a mock one")

### 问题3: 参数化查询很重要
```typescript
// ❌ 错误 (容易SQL注入)
const sql = `SELECT * FROM users WHERE id = ${id}`;

// ✅ 正确
const sql = "SELECT * FROM users WHERE id = ?";
await query(sql, [id]);
```

---

## 📈 项目统计

| 类别 | 数量 |
|------|------|
| 已生成的文档 | 4个 |
| 总文档行数 | 2061行 |
| 探索覆盖的文件 | 15+ |
| 用户相关API | 8个 |
| 关键代码片段 | 20+ |
| 数据库表 | 12个 |

---

## 🎓 学习路径建议

### 初级开发者
1. 先读 `QUICK_REFERENCE.md` (快速了解)
2. 再读 `CODEBASE_EXPLORATION.md` 第1-3部分 (理解架构)
3. 参考 `CODE_PATTERNS.md` 中的 login/register/profile (学习模式)

### 中级开发者
1. 直接读 `CODE_PATTERNS.md` (学习完整实现)
2. 参考 `CODEBASE_EXPLORATION.md` 查看具体细节
3. 基于现有模式开发新API

### 高级开发者
1. 快速扫 `README_EXPLORATION.md` (了解亮点)
2. 检查 `CODE_PATTERNS.md` 中自己不熟悉的部分
3. 基于最佳实践进行扩展开发

---

## 💡 开发建议

### ✅ 推荐做法
- 始终使用参数化查询 (? 占位符)
- 统一的错误处理格式 { code, message }
- 用 getUserFromRequest 提取用户信息
- 用 query() 做SELECT, execute() 做DML
- 所有密码都用bcryptjs加密

### ❌ 避免做法
- 不要字符串拼接构建SQL
- 不要直接返回内部错误信息
- 不要忘记参数验证
- 不要重复提交检查
- 不要忘记类型转换 (Number(teamId))

---

## 📞 快速参考

### API基本URL
```
http://localhost:3000/api/user/login
http://localhost:3000/api/user/register
http://localhost:3000/api/user/profile
http://localhost:3000/api/user/follows
```

### 管理员账号
- 用户名: `admin`
- 密码: `admin123`

### 数据库信息
- 主机: `101.96.207.88:3306`
- 数据库: `cupflow`
- 用户: `root`
- 密码: `HONGyan8158`

---

## 🚀 现在开始

**如果你有5分钟**: 打开 `QUICK_REFERENCE.md`

**如果你有20分钟**: 打开 `CODEBASE_EXPLORATION.md`

**如果你有1小时**: 打开 `CODE_PATTERNS.md`

**如果你只想快速了解**: 打开 `README_EXPLORATION.md`

---

## 📞 需要帮助?

检查对应的文档部分:

| 问题 | 查看文档 | 部分 |
|------|--------|------|
| 如何写新API? | QUICK_REFERENCE | 新建API的3步流程 |
| API怎样认证? | CODEBASE_EXPLORATION | 第2部分 |
| 数据库有哪些表? | QUICK_REFERENCE 或 README_EXPLORATION | 数据表速查 |
| 参数化查询怎样写? | QUICK_REFERENCE 或 CODE_PATTERNS | 常见错误 |
| users表有哪些字段? | CODEBASE_EXPLORATION | 第3部分 |

---

**最后更新**: 2026-05-20  
**覆盖深度**: Very Thorough ⭐⭐⭐⭐⭐  
**推荐指数**: ⭐⭐⭐⭐⭐

祝你开发愉快！🎉

