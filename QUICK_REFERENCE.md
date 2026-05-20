# CupFlow 快速参考卡片

## 🔑 核心要点

### 数据库操作
```typescript
import { query, execute } from "@/lib/db";

// SELECT - 返回数组
const users = await query<any>("SELECT * FROM users WHERE id = ?", [id]);
const count = users.length;

// INSERT/UPDATE/DELETE
const result = await execute("INSERT INTO users (nickname, password) VALUES (?, ?)", [nick, pwd]);
// result.insertId   // 新记录ID
// result.affectedRows // 影响行数
```

### 认证
```typescript
import { getUserFromRequest, getAdminFromRequest, signUserToken, hashPassword } from "@/lib/auth";

// 提取用户信息
const user = getUserFromRequest(request);  // { id, nickname } or null

// 生成Token (7天有效)
const token = signUserToken({ id: user.id, nickname: user.nickname });

// 密码加密
const hashedPwd = await hashPassword(password);
```

### API 基本骨架
```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 认证
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

    // 参数
    const { fieldName } = await request.json();
    if (!fieldName) return NextResponse.json({ code: 400, message: "参数错误" }, { status: 400 });

    // 业务逻辑
    await execute("...", [params]);

    // 返回
    return NextResponse.json({ code: 200, message: "成功", data: {} });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 📊 数据表字段速查

### users
```
id              INT PRIMARY KEY AUTO_INCREMENT
nickname        VARCHAR(50) NOT NULL UNIQUE (2-20字符)
password        VARCHAR(255) NOT NULL (bcrypt加密)
openid          VARCHAR(100) UNIQUE DEFAULT NULL (微信)
avatar_url      VARCHAR(255) DEFAULT NULL
points          INT DEFAULT 0 (竞猜积分)
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### user_follows
```
id              INT PRIMARY KEY AUTO_INCREMENT
user_id         INT NOT NULL
team_id         INT NOT NULL
created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### user_guess
```
id              INT PRIMARY KEY AUTO_INCREMENT
match_id        INT NOT NULL
user_id         INT NOT NULL
user_choose     VARCHAR(20) NOT NULL (主胜/平局/客胜)
is_right        TINYINT DEFAULT NULL (1=对, 0=错, NULL=未结算)
create_time     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### matches_
```
id              INT PRIMARY KEY AUTO_INCREMENT
home_team_id    INT NOT NULL
away_team_id    INT NOT NULL
home_score      INT DEFAULT 0
away_score      INT DEFAULT 0
status          VARCHAR(20) DEFAULT '未开始' (未开始/进行中/已结束)
match_time      VARCHAR(20) DEFAULT ''
match_date      DATE NOT NULL
stage           VARCHAR(50) NOT NULL (小组赛/1/8决赛/半决赛/决赛)
group_name      VARCHAR(10) DEFAULT NULL (A-L)
```

---

## 🔗 已有用户API

| 方法 | 路由 | 功能 | 认证 |
|------|------|------|------|
| POST | /api/user/login | 账密登录 | ❌ |
| POST | /api/user/register | 注册 | ❌ |
| GET | /api/user/profile | 个人资料 | ✅ |
| POST | /api/user/profile/update | 更新昵称/头像 | ✅ |
| POST | /api/user/avatar/upload | 上传头像 | ✅ |
| GET | /api/user/follows | 关注列表 | ✅ |
| POST | /api/user/follows | 添加关注 | ✅ |
| DELETE | /api/user/follows?teamId=X | 取消关注 | ✅ |
| POST | /api/user/wechat-login | 微信登录 | ❌ |

---

## ⚠️ 重要细节

### 密码验证
```typescript
import { comparePassword } from "@/lib/auth";

const isValid = await comparePassword(inputPassword, storedHash);
if (!isValid) {
  return NextResponse.json({ code: 401, message: "密码错误" });
}
```

### 排名计算 (见profile/route.ts)
```sql
SELECT COUNT(*) as rank FROM users 
WHERE points > (SELECT points FROM users WHERE id = ?)
-- 然后 rank = result + 1
```

### 头像上传限制
- MIME: jpeg/png/gif/webp
- 大小: 2MB
- 路径: `public/uploads/avatars/`
- 文件名: `${userId}_${Date.now()}.${ext}`

### 竞猜防重复
```typescript
const existing = await query(
  "SELECT id FROM user_guess WHERE match_id = ? AND user_id = ?",
  [matchId, userId]
);
if (existing.length > 0) {
  return NextResponse.json({ code: 400, message: "已提交过竞猜" });
}
```

### 关注防重复
```typescript
const existing = await query(
  "SELECT id FROM user_follows WHERE user_id = ? AND team_id = ?",
  [userId, teamId]
);
if (existing.length > 0) {
  return NextResponse.json({ code: 400, message: "已关注该球队" });
}
```

---

## 🚨 常见错误

❌ **在query中使用字符串拼接**
```typescript
// 错误
const users = await query(`SELECT * FROM users WHERE id = ${id}`);
```

✅ **使用参数化查询**
```typescript
// 正确
const users = await query("SELECT * FROM users WHERE id = ?", [id]);
```

---

## 💡 Tips

1. **Token在Authorization头中**: `Authorization: Bearer token_string`
2. **返回给前端的JSON必须包含 code 字段**
3. **所有错误消息都应该用户友好** (不要暴露SQL或内部错误)
4. **用户ID和管理员ID不同的Secret密钥**
5. **nickame唯一但update时允许自己保留**

---

## 🔧 开发环境特殊支持

**微信登录 Mock** (开发环境):
```typescript
if (code.includes("mock") || code === "the code is a mock one") {
  // 使用 mock_openid_devtools_test
}
```

**默认管理员**:
- 用户名: admin
- 密码: admin123

---

## 📝 新建API的3步流程

### 1. 创建文件
```
src/app/api/[模块]/[功能]/route.ts
```

### 2. 编写代码
```typescript
// 按照标准骨架编写
// 参数化查询 SELECT * FROM table WHERE field = ?
// 所有错误返回 { code, message }
```

### 3. 测试
```bash
# 用 Authorization: Bearer token 头测试
# 检查所有参数验证
# 检查SQL注入风险
```

