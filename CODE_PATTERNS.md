# CupFlow 代码模式集合

> 这份文档汇集了项目中所有关键文件的完整代码，便于理解和参考

---

## 📂 项目结构

```
cupflow-backend/
├── src/
│   ├── lib/
│   │   ├── db.ts              ← 数据库连接和查询方法
│   │   └── auth.ts            ← JWT认证和密码处理
│   ├── scripts/
│   │   └── init-db.ts         ← 数据库初始化脚本
│   └── app/api/
│       ├── user/
│       │   ├── login/         ← 账密登录
│       │   ├── register/      ← 用户注册
│       │   ├── profile/       ← 获取/更新个人资料
│       │   ├── follows/       ← 管理关注
│       │   ├── avatar/        ← 头像上传
│       │   └── wechat-login/  ← 微信登录
│       ├── guess/             ← 竞猜管理
│       └── admin/             ← 管理员API
├── public/
│   └── uploads/avatars/       ← 用户头像存储
└── .env                       ← 环境变量
```

---

## 1️⃣ lib/db.ts - 数据库连接和操作

```typescript
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "101.96.207.88",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "HONGyan8158",
  database: process.env.DB_NAME || "cupflow",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

// 通用查询方法
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// 通用执行方法（INSERT/UPDATE/DELETE）
export async function execute(sql: string, params?: any[]) {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
```

**关键特性**:
- ✅ 使用连接池 (connectionLimit: 10)
- ✅ 参数化查询 (防SQL注入)
- ✅ 泛型类型支持 `T[]`
- ✅ 返回 ResultSetHeader 包含 insertId / affectedRows

---

## 2️⃣ lib/auth.ts - 认证系统

```typescript
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.JWT_SECRET || "cupflow_admin_secret_key_2026";
const USER_SECRET = process.env.JWT_USER_SECRET || "cupflow_user_secret_key_2026";

// ====== 管理员Token相关 ======
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

// ====== 前端用户Token相关 ======
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

// ====== 密码处理 ======
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// ====== 从请求中提取信息 ======
export function getAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
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

**关键特性**:
- ✅ 用户Token: 7天有效期
- ✅ 管理员Token: 24小时有效期
- ✅ 独立的Secret密钥
- ✅ 从 Authorization: Bearer token 头提取
- ✅ bcryptjs 10轮salt加密

---

## 3️⃣ app/api/user/login/route.ts - 账密登录

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

**关键步骤**:
1. 参数验证
2. 数据库查询 (参数化)
3. bcrypt密码验证
4. JWT token生成
5. 返回统一格式

---

## 4️⃣ app/api/user/register/route.ts - 用户注册

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

**验证规则**:
- 昵称: 2-20字符
- 密码: 最少6位
- 昵称唯一性检查
- 密码bcrypt加密后保存

---

## 5️⃣ app/api/user/profile/route.ts - 获取用户资料

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
      console.error("Guesses query error:", e);
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
      console.error("Follows query error:", e);
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

**关键特性**:
- ✅ 多表JOIN查询
- ✅ 排名计算子查询
- ✅ 单独try-catch处理子查询失败
- ✅ 返回聚合数据

---

## 6️⃣ app/api/user/profile/update/route.ts - 更新用户资料

```typescript
import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
    }

    const { nickname, avatarUrl } = await request.json();

    if (!nickname || nickname.trim().length === 0) {
      return NextResponse.json({ code: 400, message: "昵称不能为空" }, { status: 400 });
    }

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length > 20) {
      return NextResponse.json({ code: 400, message: "昵称不能超过20个字符" }, { status: 400 });
    }

    // 检查昵称是否被其他用户使用
    const existing = await query(
      "SELECT id FROM users WHERE nickname = ? AND id != ?",
      [trimmedNickname, user.id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "该昵称已被使用" }, { status: 400 });
    }

    await execute(
      "UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?",
      [trimmedNickname, avatarUrl || "", user.id]
    );

    return NextResponse.json({
      code: 200,
      message: "更新成功",
      data: {
        nickname: trimmedNickname,
        avatarUrl: avatarUrl || "",
      },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

**关键细节**:
- ✅ WHERE 条件包含 `id != user.id` 允许自己保留昵称
- ✅ trim() 处理空格
- ✅ 参数化查询中 `?` 占位符

---

## 7️⃣ app/api/user/follows/route.ts - 管理关注

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// 获取用户关注列表
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

// 添加关注
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

// 取消关注
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

**关键特性**:
- ✅ 单个文件多个HTTP方法
- ✅ DELETE 从查询参数获取 ID
- ✅ 防重复检查

---

## 8️⃣ app/api/user/avatar/upload/route.ts - 头像上传

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: "未登录" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { code: 400, message: "请选择图片文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { code: 400, message: "仅支持 jpg/png/gif/webp 格式" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { code: 400, message: "图片大小不能超过 2MB" },
        { status: 400 }
      );
    }

    // 生成文件名
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}_${Date.now()}.${ext}`;

    // 确保目录存在
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, fileName), buffer);

    // 返回可访问的 URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    return NextResponse.json({
      code: 200,
      message: "上传成功",
      data: { avatarUrl },
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { code: 500, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
```

**关键特性**:
- ✅ FormData 处理
- ✅ MIME类型验证
- ✅ 文件大小限制
- ✅ 目录自动创建 (mkdir recursive)
- ✅ 文件系统操作

---

## 9️⃣ app/api/user/wechat-login/route.ts - 微信登录

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { signUserToken } from "@/lib/auth";

async function getWxOpenid(code: string): Promise<{ openid: string; session_key: string; errMsg?: string } | null> {
  const WX_APPID = process.env.WX_APPID || "";
  const WX_SECRET = process.env.WX_SECRET || "";
  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    const res = await fetch(url);
    const data: any = await res.json();
    if (data.errcode) {
      console.error("微信code2session失败:", data.errcode, data.errmsg);
      return { openid: "", session_key: "", errMsg: `${data.errcode}: ${data.errmsg}` };
    }
    return { openid: data.openid, session_key: data.session_key };
  } catch (err) {
    console.error("微信接口请求失败:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ code: 400, message: "缺少微信code" }, { status: 400 });
    }

    // 开发环境 mock：微信开发者工具模拟器无法生成真实 code，用固定测试账号
    const isMock = code.includes("mock") || code === "the code is a mock one";
    if (isMock && process.env.NODE_ENV !== "production") {
      const mockOpenid = "mock_openid_devtools_test";
      let users = await query<any>("SELECT * FROM users WHERE openid = ?", [mockOpenid]);
      let user: any;
      if (users.length > 0) {
        user = users[0];
      } else {
        const result = await execute(
          "INSERT INTO users (nickname, password, openid, avatar_url, points, created_at) VALUES (?, ?, ?, ?, 0, NOW())",
          ["测试用户", "", mockOpenid, ""]
        );
        const newUsers = await query<any>("SELECT * FROM users WHERE id = ?", [result.insertId]);
        user = newUsers[0];
      }
      const token = signUserToken({ id: user.id, nickname: user.nickname });
      return NextResponse.json({
        code: 200,
        message: "登录成功(mock)",
        data: { token, userId: user.id, nickname: user.nickname, points: user.points || 0 },
      });
    }

    // 用code换openid
    const wxResult = await getWxOpenid(code);
    if (!wxResult) {
      return NextResponse.json({ code: 500, message: "微信接口请求失败，请检查网络" }, { status: 500 });
    }
    if (wxResult.errMsg) {
      return NextResponse.json({ code: 500, message: `微信授权失败：${wxResult.errMsg}` }, { status: 500 });
    }

    const { openid } = wxResult;

    // 查找已有用户
    const users = await query<any>("SELECT * FROM users WHERE openid = ?", [openid]);

    let user: any;

    if (users.length > 0) {
      user = users[0];
    } else {
      // 新用户：用 openid 后6位生成默认昵称，头像留空
      const suffix = openid.slice(-6).toUpperCase();
      const defaultNickname = `用户_${suffix}`;

      const result = await execute(
        "INSERT INTO users (nickname, password, openid, avatar_url, points, created_at) VALUES (?, ?, ?, ?, 0, NOW())",
        [defaultNickname, "", openid, ""]
      );

      const newUsers = await query<any>("SELECT * FROM users WHERE id = ?", [result.insertId]);
      user = newUsers[0];
    }

    const token = signUserToken({ id: user.id, nickname: user.nickname });

    return NextResponse.json({
      code: 200,
      message: "登录成功",
      data: {
        token,
        userId: user.id,
        nickname: user.nickname,
        points: user.points || 0,
      },
    });
  } catch (error: any) {
    console.error("微信登录错误:", error);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

**关键特性**:
- ✅ 微信接口调用
- ✅ 开发环境mock支持
- ✅ 用户创建逻辑
- ✅ openid后缀生成昵称
- ✅ 错误处理链路

---

## 🔟 app/api/guess/[matchId]/route.ts - 竞猜管理

```typescript
import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// 获取某场比赛的投票数据
export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;

    // 获取投票统计
    let votes = await query<any>(
      "SELECT * FROM match_vote WHERE match_id = ?",
      [matchId]
    );

    if (votes.length === 0) {
      // 自动创建投票记录
      await execute("INSERT INTO match_vote (match_id) VALUES (?)", [matchId]);
      votes = [{ match_id: matchId, vote_home: 0, vote_draw: 0, vote_away: 0, final_result: null }];
    }

    // 检查当前用户是否已竞猜
    const user = getUserFromRequest(request);
    let userGuess = null;
    if (user) {
      const guesses = await query<any>(
        "SELECT * FROM user_guess WHERE match_id = ? AND user_id = ?",
        [matchId, user.id]
      );
      if (guesses.length > 0) {
        userGuess = guesses[0];
      }
    }

    return NextResponse.json({
      code: 200,
      data: { vote: votes[0], userGuess },
    });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}

// 用户提交竞猜
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
    const { choice } = await request.json(); // 主胜/平局/客胜

    if (!["主胜", "平局", "客胜"].includes(choice)) {
      return NextResponse.json({ code: 400, message: "无效的竞猜选择" }, { status: 400 });
    }

    // 检查比赛状态
    const matches = await query<any>("SELECT status FROM matches_ WHERE id = ?", [matchId]);
    if (matches.length === 0) {
      return NextResponse.json({ code: 404, message: "赛事不存在" }, { status: 404 });
    }
    if (matches[0].status !== "未开始") {
      return NextResponse.json({ code: 400, message: "比赛已开始，不能竞猜" }, { status: 400 });
    }

    // 检查是否已提交
    const existing = await query(
      "SELECT id FROM user_guess WHERE match_id = ? AND user_id = ?",
      [matchId, user.id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ code: 400, message: "已提交过竞猜" }, { status: 400 });
    }

    // 提交竞猜
    await execute(
      "INSERT INTO user_guess (match_id, user_id, user_choose) VALUES (?, ?, ?)",
      [matchId, user.id, choice]
    );

    // 更新投票总数
    if (choice === "主胜") {
      await execute("UPDATE match_vote SET vote_home = vote_home + 1 WHERE match_id = ?", [matchId]);
    } else if (choice === "平局") {
      await execute("UPDATE match_vote SET vote_draw = vote_draw + 1 WHERE match_id = ?", [matchId]);
    } else {
      await execute("UPDATE match_vote SET vote_away = vote_away + 1 WHERE match_id = ?", [matchId]);
    }

    return NextResponse.json({ code: 200, message: "竞猜成功" });
  } catch (error: any) {
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
```

**关键特性**:
- ✅ 动态路由 `[matchId]`
- ✅ 自动创建投票记录
- ✅ 防重复提交检查
- ✅ 状态验证
- ✅ 统计更新

---

## 总结

这份文档展示了CupFlow项目中所有关键的代码模式:

1. **数据库操作**: 参数化查询, 连接池
2. **认证系统**: JWT token生成/验证, bcrypt密码处理
3. **API结构**: 标准错误处理, 统一响应格式
4. **业务逻辑**: 防重复检查, 状态验证, 多表JOIN
5. **文件处理**: 头像上传, FormData处理

所有新功能都应该遵循这些模式！

