# 认证系统代码片段参考

## 核心认证文件

### src/lib/auth.ts (完整代码)

```typescript
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.JWT_SECRET || "cupflow_admin_secret_key_2026";
const USER_SECRET = process.env.JWT_USER_SECRET || "cupflow_user_secret_key_2026";

// 管理员Token相关
export function signAdminToken(payload: { id: number; username: string }) {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: "24h" });
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, ADMIN_SECRET) as { id: number; username: string };
  } catch {
    return null;
  }
}

// 前端用户Token相关
export function signUserToken(payload: { id: number; nickname: string }) {
  return jwt.sign(payload, USER_SECRET, { expiresIn: "7d" });
}

export function verifyUserToken(token: string) {
  try {
    return jwt.verify(token, USER_SECRET) as { id: number; nickname: string };
  } catch {
    return null;
  }
}

// 密码加密
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// 密码验证
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// 从请求中提取管理员信息
export function getAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyAdminToken(token);
}

// 从请求中提取用户信息
export function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyUserToken(token);
}
```

---

## 用户认证 API

### POST /api/user/register

**文件**: src/app/api/user/register/route.ts

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

    // 检查昵称是否已存在
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

---

### POST /api/user/login

**文件**: src/app/api/user/login/route.ts

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

---

### GET /api/user/profile

**文件**: src/app/api/user/profile/route.ts

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

    const users = await query<any>(
      "SELECT id, nickname, points, created_at FROM users WHERE id = ?",
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

    // 获取竞猜记录
    let guesses: any[] = [];
    try {
      guesses = await query<any>(
        `SELECT ug.id, ug.match_id, ug.user_choose, ug.is_right, ug.create_time,
          m.home_team_id, m.away_team_id, m.home_score, m.away_score, m.match_date, m.stage,
          t1.name as home_team_name, t2.name as away_team_name
         FROM user_guess ug
         LEFT JOIN matches_ m ON ug.match_id = m.id
         LEFT JOIN teams t1 ON m.home_team_id = t1.id
         LEFT JOIN teams t2 ON m.away_team_id = t2.id
         WHERE ug.user_id = ? ORDER BY ug.create_time DESC`,
        [user.id]
      );
    } catch (e) {
      guesses = [];
    }

    // 获取关注球队
    let follows: any[] = [];
    try {
      follows = await query<any>(
        `SELECT uf.id, uf.team_id, t.name, t.flag_url FROM user_follows uf
         LEFT JOIN teams t ON uf.team_id = t.id
         WHERE uf.user_id = ?`,
        [user.id]
      );
    } catch (e) {
      follows = [];
    }

    return NextResponse.json({
      code: 200,
      data: {
        ...users[0],
        rank,
        guesses,
        follows,
      },
    });
  } catch (error: any) {
    console.error("Profile API Error:", error.message);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 管理员认证 API

### POST /api/auth/login

**文件**: src/app/api/auth/login/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword, signAdminToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ code: 400, message: "用户名和密码不能为空" }, { status: 400 });
    }

    const admins = await query<any>(
      "SELECT * FROM admins WHERE username = ?",
      [username]
    );

    if (admins.length === 0) {
      return NextResponse.json({ code: 401, message: "用户名或密码错误" }, { status: 401 });
    }

    const admin = admins[0];
    const isValid = await comparePassword(password, admin.password);

    if (!isValid) {
      return NextResponse.json({ code: 401, message: "用户名或密码错误" }, { status: 401 });
    }

    const token = signAdminToken({ id: admin.id, username: admin.username });

    const response = NextResponse.json({
      code: 200,
      message: "登录成功",
      data: { token, username: admin.username },
    });

    // 设置cookie
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24小时
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

### POST /api/auth/logout

**文件**: src/app/api/auth/logout/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ code: 200, message: "退出成功" });
  response.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
  return response;
}
```

---

## 用户关注管理 API

### GET /api/user/follows

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const follows = await query<any>(
      `SELECT uf.id, uf.team_id, t.name, t.flag_url, t.continent
       FROM user_follows uf
       LEFT JOIN teams t ON uf.team_id = t.id
       WHERE uf.user_id = ?`,
      [user.id]
    );

    return NextResponse.json({ code: 200, data: follows });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### POST /api/user/follows

```typescript
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json({ code: 400, message: "球队ID不能为空" }, { status: 400 });
    }

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

    return NextResponse.json({ code: 200, message: "关注成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

### DELETE /api/user/follows

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    if (!teamId) {
      return NextResponse.json({ code: 400, message: "球队ID不能为空" }, { status: 400 });
    }

    await execute(
      "DELETE FROM user_follows WHERE user_id = ? AND team_id = ?",
      [user.id, Number(teamId)]
    );

    return NextResponse.json({ code: 200, message: "取消关注成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

---

## 中间件保护

### src/middleware.ts

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API OPTIONS 预检请求
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

  // 管理后台路由保护（排除登录页）
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    // 这里只检查客户端cookie中的token是否存在
    // 实际验证在各API中进行
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
```

---

## 前端调用示例

### JavaScript/TypeScript 客户端

```typescript
// API 客户端类
class AuthClient {
  private baseURL = "http://localhost:3000";

  // 用户注册
  async registerUser(nickname: string, password: string) {
    const res = await fetch(`${this.baseURL}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });
    return res.json();
  }

  // 用户登录
  async loginUser(nickname: string, password: string) {
    const res = await fetch(`${this.baseURL}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, password }),
    });
    const data = await res.json();
    if (data.code === 200) {
      localStorage.setItem("userToken", data.data.token);
      localStorage.setItem("userId", data.data.userId);
    }
    return data;
  }

  // 获取用户资料
  async getProfile(token: string) {
    const res = await fetch(`${this.baseURL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  // 获取关注列表
  async getFollows(token: string) {
    const res = await fetch(`${this.baseURL}/api/user/follows`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  }

  // 关注球队
  async followTeam(token: string, teamId: number) {
    const res = await fetch(`${this.baseURL}/api/user/follows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teamId }),
    });
    return res.json();
  }

  // 管理员登录
  async adminLogin(username: string, password: string) {
    const res = await fetch(`${this.baseURL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  }
}

// 使用示例
const auth = new AuthClient();

// 注册新用户
const signUpResult = await auth.registerUser("newuser", "password123");
console.log("注册结果:", signUpResult);

// 登录用户
const loginResult = await auth.loginUser("newuser", "password123");
if (loginResult.code === 200) {
  const token = loginResult.data.token;
  
  // 获取用户资料
  const profile = await auth.getProfile(token);
  console.log("用户资料:", profile.data);
}
```

---

**代码片段参考 v1.0** | 2026-05-19
