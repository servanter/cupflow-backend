# 🔧 CupFlow 代码模式参考

> 可直接复制使用的完整代码片段，覆盖项目中所有关键模式

---

## 1. API 模板

### GET 需要认证

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

### POST 需要认证

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
      "INSERT INTO table (user_id, field_name) VALUES (?, ?)",
      [user.id, fieldName]
    );

    return NextResponse.json({ code: 200, message: "操作成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### DELETE 需要认证

```typescript
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

### 路径参数 + 请求体

```typescript
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

    // 防重复提交
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

### 管理员认证 API

```typescript
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

---

## 2. 数据库操作模板

### SELECT 查询

```typescript
// 单行查询
const users = await query<any>("SELECT * FROM users WHERE id = ?", [1]);
const user = users[0]; // 取第一条（注意判空）

// 多行查询
const allUsers = await query("SELECT id, nickname, points FROM users LIMIT 10");

// 计数查询
const countResult = await query<any>("SELECT COUNT(*) as total FROM users");
const total = countResult[0].total;
```

### INSERT / UPDATE / DELETE

```typescript
// INSERT - 获取自增 ID
const result = await execute(
  "INSERT INTO users (nickname, password) VALUES (?, ?)",
  ["张三", hashedPassword]
);
const newUserId = result.insertId;

// UPDATE - 获取影响行数
const result = await execute(
  "UPDATE users SET points = points + ? WHERE id = ?",
  [10, userId]
);
const affected = result.affectedRows;

// DELETE
await execute("DELETE FROM users WHERE id = ?", [userId]);
```

### 分页查询

```typescript
const page = Math.max(1, Number(searchParams.get("page")) || 1);
const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
const offset = (page - 1) * limit;

const items = await query(
  "SELECT * FROM table ORDER BY created_at DESC LIMIT ? OFFSET ?",
  [limit, offset]
);
const countResult = await query<any>("SELECT COUNT(*) as total FROM table");
const total = countResult[0]?.total || 0;

return NextResponse.json({
  code: 200,
  data: { list: items, total, page, limit }
});
```

### 动态条件查询

```typescript
let sql = "SELECT * FROM matches_ WHERE 1=1";
const params: any[] = [];

if (status) { sql += " AND status = ?"; params.push(status); }
if (stage)  { sql += " AND stage = ?";  params.push(stage); }
if (date)   { sql += " AND match_date = ?"; params.push(date); }

sql += " ORDER BY match_date, match_time";
const matches = await query(sql, params);
```

---

## 3. 认证模板

### 生成 Token

```typescript
import { signUserToken } from "@/lib/auth";

const token = signUserToken({ id: 1, nickname: "张三" });

return NextResponse.json({
  code: 200,
  data: { token }
});
```

### 验证 Token（API 中）

```typescript
import { getUserFromRequest } from "@/lib/auth";

const user = getUserFromRequest(request);
if (!user) {
  return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
}
// user.id, user.nickname 可用
```

### 前端使用 Token

```typescript
// 存储
localStorage.setItem("token", response.data.token);

// 发送请求
fetch("/api/user/profile", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
});
```

---

## 4. 完整业务逻辑示例

### 用户注册

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json({ code: 400, message: "昵称和密码不能为空" }, { status: 400 });
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json({ code: 400, message: "昵称长度需在2-20个字符之间" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ code: 400, message: "密码长度至少6位" }, { status: 400 });
    }

    const existing = await query("SELECT id FROM users WHERE nickname = ?", [nickname]);
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "该昵称已被注册" }, { status: 400 });
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

### 用户登录

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { nickname, password } = await request.json();

    if (!nickname || !password) {
      return NextResponse.json({ code: 400, message: "昵称和密码不能为空" }, { status: 400 });
    }

    const users = await query<any>("SELECT * FROM users WHERE nickname = ?", [nickname]);
    if (users.length === 0) {
      return NextResponse.json({ code: 401, message: "昵称或密码错误" }, { status: 401 });
    }

    const user = users[0];
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ code: 401, message: "昵称或密码错误" }, { status: 401 });
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

### 用户资料（多表 JOIN + 排名计算）

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const users = await query<any>(
      "SELECT id, nickname, points, avatar_url, created_at FROM users WHERE id = ?",
      [user.id]
    );
    if (users.length === 0) {
      return NextResponse.json({ code: 404, message: "用户不存在" }, { status: 404 });
    }

    // 计算排名
    const rankResult = await query<any>(
      "SELECT COUNT(*) as `rank` FROM users WHERE points > (SELECT points FROM users WHERE id = ?)",
      [user.id]
    );
    const rank = (rankResult[0]?.rank || 0) + 1;

    // 竞猜历史（3表 JOIN）
    let guesses: any[] = [];
    try {
      guesses = await query<any>(
        `SELECT ug.id, ug.match_id, ug.user_choose, ug.is_right, ug.create_time,
          m.home_score, m.away_score, m.match_date, m.stage,
          t1.name as home_team_name, t2.name as away_team_name
         FROM user_guess ug
         LEFT JOIN matches_ m ON ug.match_id = m.id
         LEFT JOIN teams t1 ON m.home_team_id = t1.id
         LEFT JOIN teams t2 ON m.away_team_id = t2.id
         WHERE ug.user_id = ? ORDER BY ug.create_time DESC`,
        [user.id]
      );
    } catch (e) { guesses = []; }

    // 关注球队
    let follows: any[] = [];
    try {
      follows = await query<any>(
        `SELECT uf.id, uf.team_id, t.name, t.flag_url
         FROM user_follows uf
         LEFT JOIN teams t ON uf.team_id = t.id
         WHERE uf.user_id = ?`,
        [user.id]
      );
    } catch (e) { follows = []; }

    return NextResponse.json({
      code: 200,
      data: { ...users[0], rank, guesses, follows },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### 防重复关注

```typescript
// 检查是否已关注
const existing = await query(
  "SELECT id FROM user_follows WHERE user_id = ? AND team_id = ?",
  [user.id, teamId]
);
if (existing.length > 0) {
  return NextResponse.json({ code: 400, message: "已关注该球队" }, { status: 400 });
}

await execute(
  "INSERT INTO user_follows (user_id, team_id) VALUES (?, ?)",
  [user.id, teamId]
);
```

### 头像上传（FormData）

```typescript
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ code: 400, message: "请选择图片文件" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ code: 400, message: "仅支持 jpg/png/gif/webp" }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ code: 400, message: "图片不能超过 2MB" }, { status: 400 });

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      code: 200,
      message: "上传成功",
      data: { avatarUrl: `/uploads/avatars/${fileName}` },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 5. 前端调用示例

```typescript
class ApiClient {
  private baseURL = "http://localhost:3000";
  private token = localStorage.getItem("userToken") || "";

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.baseURL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { "Authorization": `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
      ...options,
    });
    return res.json();
  }

  // 用户注册
  async register(nickname: string, password: string) {
    return this.request("/api/user/register", {
      method: "POST",
      body: JSON.stringify({ nickname, password }),
    });
  }

  // 用户登录
  async login(nickname: string, password: string) {
    const data = await this.request("/api/user/login", {
      method: "POST",
      body: JSON.stringify({ nickname, password }),
    });
    if (data.code === 200) {
      this.token = data.data.token;
      localStorage.setItem("userToken", this.token);
    }
    return data;
  }

  // 获取用户资料
  async getProfile() {
    return this.request("/api/user/profile");
  }

  // 关注球队
  async followTeam(teamId: number) {
    return this.request("/api/user/follows", {
      method: "POST",
      body: JSON.stringify({ teamId }),
    });
  }

  // 提交竞猜
  async submitGuess(matchId: number, choice: "主胜" | "平局" | "客胜") {
    return this.request(`/api/guess/${matchId}`, {
      method: "POST",
      body: JSON.stringify({ choice }),
    });
  }
}

// 使用示例
const api = new ApiClient();
const loginResult = await api.login("player123", "pass123");
if (loginResult.code === 200) {
  const profile = await api.getProfile();
  console.log("用户资料:", profile.data);
}
```

---

## 6. 最佳实践 ✅ vs ❌

```typescript
// ❌ SQL 注入风险
const sql = `SELECT * FROM users WHERE nickname = '${nickname}'`;

// ✅ 参数化查询
const sql = "SELECT * FROM users WHERE nickname = ?";
await query(sql, [nickname]);

// ❌ 表名错误
"SELECT * FROM matches"

// ✅ 正确表名
"SELECT * FROM matches_"

// ❌ 不验证就使用
const user = getUserFromRequest(request);
const id = user.id; // 可能崩溃

// ✅ 先验证
const user = getUserFromRequest(request);
if (!user) return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });

// ❌ 不检查重复
await execute("INSERT INTO user_follows ...");

// ✅ 先检查再插入
const existing = await query("SELECT id FROM user_follows WHERE user_id = ? AND team_id = ?", [userId, teamId]);
if (existing.length > 0) return NextResponse.json({ code: 400, message: "已关注" }, { status: 400 });
await execute("INSERT INTO user_follows ...");

// ❌ 暴露内部错误
return NextResponse.json({ code: 500, message: error.message });

// ✅ 隐藏内部错误
return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
```
