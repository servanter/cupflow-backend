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
    const { code, nickname, avatarUrl } = await request.json();

    if (!code) {
      return NextResponse.json({ code: 400, message: "缺少微信code" }, { status: 400 });
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
      // 已注册用户，直接登录
      user = users[0];
    } else {
      // 新用户：有真实昵称就用，否则用 openid 后6位
      const suffix = openid.slice(-6).toUpperCase();
      const finalNickname = (nickname && nickname !== "微信用户") ? nickname : `用户_${suffix}`;

      const result = await execute(
        "INSERT INTO users (nickname, password, openid, avatar_url, points, created_at) VALUES (?, ?, ?, ?, 0, NOW())",
        [finalNickname, "", openid, avatarUrl || ""]
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
        avatarUrl: user.avatar_url || "",
      },
    });
  } catch (error: any) {
    console.error("微信登录错误:", error);
    return NextResponse.json({ code: 500, message: "服务器内部错误" }, { status: 500 });
  }
}
