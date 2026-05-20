/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用 instrumentation.ts（后台调度器）
  experimental: {
    instrumentationHook: true,
  },
  // 允许跨域请求（UniApp前端）
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
