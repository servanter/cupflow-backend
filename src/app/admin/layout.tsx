"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "仪表盘", path: "/admin/dashboard", icon: "📊" },
  { label: "球队管理", path: "/admin/teams", icon: "🏟️" },
  { label: "球员管理", path: "/admin/players", icon: "⚽" },
  { label: "赛事管理", path: "/admin/matches", icon: "🏆" },
  { label: "文字直播", path: "/admin/live", icon: "📡" },
  { label: "精彩回放", path: "/admin/highlights", icon: "🎬" },
  { label: "足球资讯", path: "/admin/news", icon: "📰" },
  { label: "评论管理", path: "/admin/comments", icon: "💬" },
  { label: "用户管理", path: "/admin/users", icon: "👥" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 登录页不显示侧边栏
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <aside className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className={`font-bold text-lg ${collapsed ? "hidden" : "block"}`}>
            ⚽ CupFlow
          </h1>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white mt-2"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 hover:bg-gray-800 transition-colors ${
                pathname === item.path ? "bg-gray-800 border-l-4 border-blue-500" : ""
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部导航 */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find((m) => m.path === pathname)?.label || "管理后台"}
          </h2>
          <Button variant="ghost" onClick={handleLogout}>
            退出登录
          </Button>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
