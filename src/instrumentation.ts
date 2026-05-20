/**
 * Next.js instrumentation — 服务器启动时执行
 * 启动微信订阅消息调度器（access_token 刷新 + 到期提醒推送）
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWxScheduler } = await import("./lib/wx-scheduler");
    startWxScheduler();
  }
}
