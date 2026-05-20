# 📚 项目探索完成总结

> 已完成CupFlow后端项目的全面代码探索，生成了完整的参考文档

---

## 📄 生成的文档列表

### 1. **CODEBASE_EXPLORATION.md** ⭐ 主要参考
   - 项目完整架构概览
   - 数据库层详解 (db.ts)
   - 认证层详解 (auth.ts)
   - Users表完整字段说明
   - 所有用户API路由 (8个)
   - 竞猜API参考
   - 管理员API模式
   - 数据库表速查表
   - 常用代码片段

### 2. **QUICK_REFERENCE.md** ⚡ 快速查询
   - 核心代码片段速查
   - 数据表字段速查
   - 已有API列表 (表格)
   - 重要细节提示
   - 常见错误和正确做法
   - 开发环境配置

### 3. **CODE_PATTERNS.md** 🔧 完整代码参考
   - 10个关键文件的完整代码
   - 每个文件的关键特性标注
   - 代码之间的关联关系
   - 实际项目中的最佳实践

---

## 🔍 关键发现

### ✅ 已确认的特性

**数据库层** (`src/lib/db.ts`)
- ✅ MySQL连接池 (10个连接)
- ✅ 参数化查询 (防SQL注入)
- ✅ 泛型类型支持 `T[]`
- ✅ query() 用于SELECT, execute() 用于DML

**认证系统** (`src/lib/auth.ts`)
- ✅ JWT认证 (两个不同的Secret)
- ✅ 用户Token: 7天有效期
- ✅ 管理员Token: 24小时有效期
- ✅ bcryptjs密码加密 (10轮salt)
- ✅ 从Authorization: Bearer token头提取

**用户相关API** (8个路由)
- ✅ POST /api/user/login - 账密登录
- ✅ POST /api/user/register - 用户注册 (2-20字符昵称, 6位密码)
- ✅ GET /api/user/profile - 个人资料 (含排名计算)
- ✅ POST /api/user/profile/update - 更新昵称/头像
- ✅ POST /api/user/avatar/upload - 头像上传 (2MB, jpeg/png/gif/webp)
- ✅ GET /api/user/follows - 关注列表
- ✅ POST /api/user/follows - 添加关注
- ✅ DELETE /api/user/follows?teamId=X - 取消关注

**特殊功能**
- ✅ POST /api/user/wechat-login - 微信登录 (需openid字段)
- ✅ POST /api/guess/[matchId] - 竞猜管理 (防重复)
- ✅ 头像存储: `public/uploads/avatars/`

---

### ⚠️ 已发现的问题

❌ **users表缺少字段**
```sql
-- 需要执行这些迁移:
ALTER TABLE users ADD COLUMN openid VARCHAR(100) UNIQUE DEFAULT NULL;
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;
```

❌ **微信登录依赖** 
- wechat-login/route.ts 需要 openid 字段
- 需要验证 WX_APPID 和 WX_SECRET 的有效性

---

## 📊 关键代码速查

### 数据库操作
```typescript
// 查询
const users = await query<any>("SELECT * FROM users WHERE id = ?", [id]);

// 插入/更新/删除
const result = await execute("INSERT INTO users (nickname, password) VALUES (?, ?)", [nick, pwd]);
console.log(result.insertId);   // 新记录ID
console.log(result.affectedRows); // 影响行数
```

### 认证
```typescript
// 提取用户
const user = getUserFromRequest(request);  // { id, nickname } or null

// 生成Token
const token = signUserToken({ id: user.id, nickname: user.nickname });

// 验证密码
const isValid = await comparePassword(inputPassword, storedHash);
```

### API基本骨架
```typescript
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

    const { field } = await request.json();
    if (!field) return NextResponse.json({ code: 400, message: "参数错误" }, { status: 400 });

    await execute("INSERT ...", [params]);

    return NextResponse.json({ code: 200, message: "成功", data: {} });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 🗂️ 数据库表全览

| 表名 | 用途 | 关键字段 |
|------|------|--------|
| users | 用户账号 | id, nickname (UNIQUE), password, points, created_at, openid, avatar_url |
| user_follows | 关注关系 | id, user_id, team_id, created_at |
| user_guess | 竞猜记录 | id, match_id, user_id, user_choose, is_right, create_time |
| match_vote | 投票统计 | id, match_id, vote_home, vote_draw, vote_away, final_result |
| matches_ | 比赛赛程 | id, home_team_id, away_team_id, status, match_date, stage, group_name |
| teams | 球队信息 | id, name, flag_url, continent, coach |
| players | 球员信息 | id, name, team_id, position, club, goals, assists |

---

## 🎯 使用指南

### 查询某个具体的API实现
→ 打开 **CODEBASE_EXPLORATION.md** 的第4-5部分

### 快速查看字段或API列表
→ 打开 **QUICK_REFERENCE.md**

### 学习完整的代码模式
→ 打开 **CODE_PATTERNS.md** (包含所有10个关键文件的完整代码)

### 开发新API时
1. 查看 CODE_PATTERNS.md 中相似的API实现
2. 参考 QUICK_REFERENCE.md 中的"新建API的3步流程"
3. 确保遵循参数化查询、统一错误处理等模式

---

## 📋 API响应格式统一

**成功** (200)
```json
{
  "code": 200,
  "message": "成功提示信息",
  "data": { /* 实际业务数据 */ }
}
```

**错误** (400/401/404/500)
```json
{
  "code": 400,
  "message": "用户友好的错误信息"
}
```

**错误码约定**
- 400: 请求参数错误
- 401: 未登录或权限不足
- 404: 资源不存在
- 500: 服务器内部错误

---

## 🔒 安全实践

✅ **已实现的安全措施**
- 参数化查询 (防SQL注入)
- bcryptjs 密码加密 (10轮salt)
- JWT token认证
- 错误消息隐藏 (不暴露SQL/内部错误)
- 防重复提交检查 (竞猜/关注)

⚠️ **需要注意的**
- Token来自Authorization: Bearer token头
- 昵称必须唯一 (UPDATE时允许自己保留)
- 参数必须参数化 (使用 ?)

---

## 💡 开发小贴士

1. **不要使用字符串拼接构建SQL**
   ```typescript
   // ❌ 错误
   const sql = `SELECT * FROM users WHERE id = ${userId}`;
   
   // ✅ 正确
   const sql = "SELECT * FROM users WHERE id = ?";
   await query(sql, [userId]);
   ```

2. **防重复提交**
   ```typescript
   const existing = await query("SELECT id FROM table WHERE user_id = ? AND field = ?", [userId, value]);
   if (existing.length > 0) {
     return NextResponse.json({ code: 400, message: "已存在" });
   }
   ```

3. **多表JOIN参考**
   - 见 profile/route.ts 中的竞猜记录查询

4. **排名计算** (使用子查询)
   ```sql
   SELECT COUNT(*) as rank FROM users 
   WHERE points > (SELECT points FROM users WHERE id = ?)
   ```
   然后 rank = result + 1

5. **FormData处理** (头像上传)
   ```typescript
   const formData = await request.formData();
   const file = formData.get("file") as File | null;
   ```

---

## 📞 环境配置参考

**.env文件**
```
DB_HOST=101.96.207.88
DB_PORT=3306
DB_USER=root
DB_PASSWORD=HONGyan8158
DB_NAME=cupflow

JWT_SECRET=cupflow_admin_secret_key_2026
JWT_USER_SECRET=cupflow_user_secret_key_2026

WX_APPID=wxeacde40b235f447b
WX_SECRET=597df83e929dca0ce9491bac809c276f
```

**管理员默认账号**
- 用户名: admin
- 密码: admin123

---

## 🎓 总体架构理解

```
Frontend (axios) 
    ↓
API Routes (src/app/api/*)
    ↓ (request body/params)
    ↓ 认证 (getUserFromRequest)
    ↓ 参数验证
    ↓ 数据库操作 (query/execute)
    ↓
MySQL Database
    ↓
返回 { code, message, data }
    ↓
Frontend (receive JSON)
```

所有API都遵循这个流程！

---

## ✨ 项目亮点

✅ **架构清晰** - 分层明确 (DB → Auth → Routes)
✅ **类型安全** - TypeScript + 泛型
✅ **安全可靠** - 参数化查询, JWT认证, 密码加密
✅ **错误处理完善** - 统一响应格式, 隐藏内部错误
✅ **易于扩展** - 已有的模式可直接复用
✅ **文档齐全** - 本探索文档

---

## 🚀 开始开发

现在你已经掌握了整个项目的核心原理，可以:

1. 添加新的API端点 (参考CODE_PATTERNS.md)
2. 修改现有业务逻辑
3. 扩展数据库功能
4. 集成新的第三方服务

按照现有的模式开发，保持代码一致性！

---

**文档最后更新**: 2026-05-20
**探索深度**: Very Thorough (超级详细)
**覆盖范围**: 所有用户API + 认证系统 + DB层 + 竞猜系统 + 管理员API

