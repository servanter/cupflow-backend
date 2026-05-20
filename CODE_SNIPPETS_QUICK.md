# CupFlow 代码片段快速参考

## 🔑 关键代码片段 (可直接复制使用)

### 1. 标准 GET 需要认证的 API 模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const data = await query<any>(
      "SELECT * FROM table WHERE user_id = ? ORDER BY created_at DESC",
      [user.id]
    );

    return NextResponse.json({ code: 200, data });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 2. 标准 POST 需要认证的 API 模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "请先登录" }, { status: 401 });
    }

    const { fieldName } = await request.json();
    if (!fieldName) {
      return NextResponse.json({ code: 400, message: "参数不完整" }, { status: 400 });
    }

    await execute(
      "INSERT INTO table (user_id, fieldName) VALUES (?, ?)",
      [user.id, fieldName]
    );

    return NextResponse.json({ code: 200, message: "操作成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 3. 标准 DELETE 需要认证的 API 模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ code: 400, message: "ID不能为空" }, { status: 400 });
    }

    await execute(
      "DELETE FROM table WHERE id = ? AND user_id = ?",
      [id, user.id]
    );

    return NextResponse.json({ code: 200, message: "删除成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 4. 路径参数 + 请求体的 POST 模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "请先登录" }, { status: 401 });
    }

    const matchId = params.matchId;
    const { choice } = await request.json();

    if (!["选项1", "选项2"].includes(choice)) {
      return NextResponse.json({ code: 400, message: "无效的选择" }, { status: 400 });
    }

    // 检查是否已提交
    const existing = await query(
      "SELECT id FROM table WHERE match_id = ? AND user_id = ?",
      [matchId, user.id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "已提交过" }, { status: 400 });
    }

    await execute(
      "INSERT INTO table (match_id, user_id, choice) VALUES (?, ?, ?)",
      [matchId, user.id, choice]
    );

    return NextResponse.json({ code: 200, message: "提交成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 5. 分页查询模板

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const offset = (page - 1) * limit;

    const items = await query(
      `SELECT * FROM table ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const countResult = await query<any>(
      "SELECT COUNT(*) as total FROM table"
    );
    const total = countResult[0]?.total || 0;

    return NextResponse.json({ 
      code: 200, 
      data: { list: items, total, page, limit } 
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 6. 用户注册模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { code: 400, message: "昵称和密码不能为空" }, 
        { status: 400 }
      );
    }

    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { code: 400, message: "昵称长度需在2-20个字符之间" }, 
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { code: 400, message: "密码长度至少6位" }, 
        { status: 400 }
      );
    }

    const existing = await query("SELECT id FROM users WHERE nickname = ?", [nickname]);
    if (existing.length > 0) {
      return NextResponse.json(
        { code: 400, message: "该昵称已被注册" }, 
        { status: 400 }
      );
    }

    const hashedPwd = await hashPassword(password);
    const result = await execute(
      "INSERT INTO users (nickname, password) VALUES (?, ?)",
      [nickname, hashedPwd]
    );

    const token = signUserToken({ id: result.insertId, nickname });

    return NextResponse.json({
      code: 200,
      message: "注册成功",
      data: { token, userId: result.insertId, nickname },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 7. 用户登录模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json(
        { code: 400, message: "昵称和密码不能为空" }, 
        { status: 400 }
      );
    }

    const users = await query<any>("SELECT * FROM users WHERE nickname = ?", [nickname]);
    if (users.length === 0) {
      return NextResponse.json(
        { code: 401, message: "昵称或密码错误" }, 
        { status: 401 }
      );
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { code: 401, message: "昵称或密码错误" }, 
        { status: 401 }
      );
    }

    const token = signUserToken({ id: user.id, nickname: user.nickname });

    return NextResponse.json({
      code: 200,
      message: "登录成功",
      data: { token, userId: user.id, nickname: user.nickname, points: user.points },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 8. 管理员认证 API 模板

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ code: 401, message: "未授权" }, { status: 401 });
    }

    const data = await query("SELECT * FROM table");
    return NextResponse.json({ code: 200, data });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 9. 条件查询的 SQL 构建

```typescript
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");
    const date = searchParams.get("date");

    let sql = "SELECT * FROM matches_ WHERE 1=1";
    const params: any[] = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (stage) {
      sql += " AND stage = ?";
      params.push(stage);
    }
    if (date) {
      sql += " AND match_date = ?";
      params.push(date);
    }

    sql += " ORDER BY match_date, match_time";

    const matches = await query(sql, params);
    return NextResponse.json({ code: 200, data: matches });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 10. 子查询与 JOIN 的复杂查询

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    // 计算排名
    const rankResult = await query<any>(
      "SELECT COUNT(*) as `rank` FROM users WHERE points > (SELECT points FROM users WHERE id = ?)",
      [user.id]
    );
    const rank = (rankResult[0]?.rank || 0) + 1;

    // 获取竞猜记录（多表 JOIN）
    const guesses = await query<any>(
      `SELECT ug.id, ug.match_id, ug.user_choose, ug.is_right, ug.create_time,
              m.home_team_id, m.away_team_id, m.home_score, m.away_score,
              t1.name as home_team_name, t2.name as away_team_name
       FROM user_guess ug
       LEFT JOIN matches_ m ON ug.match_id = m.id
       LEFT JOIN teams t1 ON m.home_team_id = t1.id
       LEFT JOIN teams t2 ON m.away_team_id = t2.id
       WHERE ug.user_id = ? ORDER BY ug.create_time DESC`,
      [user.id]
    );

    return NextResponse.json({
      code: 200,
      data: { rank, guesses },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 📊 数据库常用操作

### 查询 (SELECT) - 总是返回数组

```typescript
// 单行查询 - 获取第一条
const users = await query<any>("SELECT * FROM users WHERE id = ?", [1]);
if (users.length > 0) {
  const user = users[0]; // 取第一条
}

// 多行查询
const allUsers = await query("SELECT * FROM users LIMIT 10");

// 计数查询
const countResult = await query<any>("SELECT COUNT(*) as total FROM users");
const total = countResult[0].total;

// 指定字段
const userData = await query(
  "SELECT id, nickname, points FROM users WHERE id = ?", 
  [1]
);
```

### 执行 (INSERT/UPDATE/DELETE) - 返回 ResultSetHeader

```typescript
// INSERT - 获取自增ID
const insertResult = await execute(
  "INSERT INTO users (nickname, password) VALUES (?, ?)",
  ["张三", hashedPassword]
);
const newUserId = insertResult.insertId;

// UPDATE - 获取影响行数
const updateResult = await execute(
  "UPDATE users SET points = points + ? WHERE id = ?",
  [10, userId]
);
const affectedRows = updateResult.affectedRows;

// DELETE
const deleteResult = await execute(
  "DELETE FROM users WHERE id = ?",
  [userId]
);
```

---

## 🔐 JWT Token 快速参考

### 生成 Token

```typescript
import { signUserToken } from "@/lib/auth";

// 用户 Token (7天有效)
const token = signUserToken({ id: 1, nickname: "张三" });

// 返回给前端
return NextResponse.json({
  code: 200,
  data: { token }
});
```

### 获取 Token 中的用户信息

```typescript
import { getUserFromRequest } from "@/lib/auth";

const user = getUserFromRequest(request);
if (!user) {
  // Token 无效或过期
  return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
}

// user 结构: { id: number, nickname: string }
const userId = user.id;
const nickname = user.nickname;
```

### 前端使用 Token

```typescript
// 存储 Token
localStorage.setItem("token", response.data.token);

// 发送请求时附加 Token
fetch("/api/user/profile", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
});
```

---

## 📝 常用的错误响应

```typescript
// 400 - 参数错误
return NextResponse.json({ code: 400, message: "参数名称错误" }, { status: 400 });

// 401 - 未登录/认证失败
return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

// 404 - 资源不存在
return NextResponse.json({ code: 404, message: "资源不存在" }, { status: 404 });

// 500 - 服务器错误
return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
```

---

## 🎯 完整的新功能添加流程

1. **新增 API 文件**:
   ```bash
   mkdir -p src/app/api/user/new-feature
   touch src/app/api/user/new-feature/route.ts
   ```

2. **填入模板代码** (参考上面的模板)

3. **数据库迁移** (如需要):
   ```sql
   ALTER TABLE table_name ADD COLUMN new_field TYPE DEFAULT value;
   ```

4. **测试 API**:
   ```bash
   npm run dev
   curl -X POST http://localhost:3000/api/user/new-feature \
     -H "Authorization: Bearer token" \
     -H "Content-Type: application/json" \
     -d '{"field": "value"}'
   ```

---

## ⚠️ 常见错误避免

❌ **不要这样做**:
```typescript
// 1. 字符串拼接 SQL (SQL 注入风险)
const sql = `SELECT * FROM users WHERE nickname = '${nickname}'`;

// 2. 表名错误 (matches 不存在，应该是 matches_)
const sql = "SELECT * FROM matches";

// 3. 忘记错误处理
const user = getUserFromRequest(request); // 不检查就使用
const id = user.id; // 可能崩溃

// 4. 不验证参数
const { choice } = await request.json(); // 直接使用不检查
```

✅ **这样做是对的**:
```typescript
// 1. 参数化查询
const sql = "SELECT * FROM users WHERE nickname = ?";
const result = await query(sql, [nickname]);

// 2. 使用正确的表名
const sql = "SELECT * FROM matches_";

// 3. 先验证再使用
const user = getUserFromRequest(request);
if (!user) {
  return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
}

// 4. 验证参数
if (!["选项1", "选项2"].includes(choice)) {
  return NextResponse.json({ code: 400, message: "无效选择" }, { status: 400 });
}
```

