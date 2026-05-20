import { query, execute } from "./db";

const WX_APPID = process.env.WX_APPID || "wxeacde40b235f447b";
const WX_SECRET = process.env.WX_SECRET || "597df83e929dca0ce9491bac809c276f";

/**
 * 获取有效的微信 access_token
 * 优先从 DB 缓存读取，过期则重新获取
 */
export async function getAccessToken(): Promise<string> {
  const rows = await query<{
    access_token: string;
    expires_at: Date;
  }>("SELECT access_token, expires_at FROM wx_access_token ORDER BY id ASC LIMIT 1");

  if (rows.length > 0) {
    const { access_token, expires_at } = rows[0];
    // 提前 5 分钟认为过期
    const expiresAt = new Date(expires_at).getTime() - 5 * 60 * 1000;
    if (Date.now() < expiresAt) {
      return access_token;
    }
  }

  // 重新获取
  await refreshAccessToken();
  const fresh = await query<{ access_token: string }>(
    "SELECT access_token FROM wx_access_token ORDER BY id ASC LIMIT 1"
  );
  if (fresh.length === 0) throw new Error("access_token 获取失败");
  return fresh[0].access_token;
}

/**
 * 从微信服务器刷新 access_token 并写入 DB
 */
export async function refreshAccessToken(): Promise<void> {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`;
  const res = await fetch(url);
  const data: any = await res.json();

  if (data.errcode) {
    console.error(`[wx-token] 获取 access_token 失败: ${data.errmsg}`);
    throw new Error(data.errmsg);
  }

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  // UPSERT：只保留一行（id=1）
  await execute(
    `INSERT INTO wx_access_token (id, access_token, expires_at)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), expires_at = VALUES(expires_at)`,
    [data.access_token, expiresAt]
  );

  console.log(`[wx-token] access_token 已刷新，有效期至 ${expiresAt.toLocaleString()}`);
}
