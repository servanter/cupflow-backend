"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    matches: 0,
    users: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const headers: any = { Authorization: `Bearer ${token}` };

      const [teamsRes, matchesRes, playersRes, usersRes] = await Promise.all([
        fetch("/api/teams", { headers }),
        fetch("/api/matches", { headers }),
        fetch("/api/admin/players", { headers }),
        fetch("/api/admin/users", { headers }),
      ]);

      const teamsData = await teamsRes.json();
      const matchesData = await matchesRes.json();
      const playersData = await playersRes.json();
      const usersData = await usersRes.json();

      setStats({
        teams: teamsData.data?.length || 0,
        players: playersData.data?.length || 0,
        matches: matchesData.data?.length || 0,
        users: usersData.data?.length || 0,
      });
    } catch (err) {
      console.error("获取统计数据失败:", err);
    }
  };

  const statCards = [
    { title: "参赛球队", value: stats.teams, icon: "🏟️", color: "text-blue-600" },
    { title: "注册球员", value: stats.players, icon: "⚽", color: "text-green-600" },
    { title: "赛事场次", value: stats.matches, icon: "🏆", color: "text-orange-600" },
    { title: "注册用户", value: stats.users, icon: "👥", color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/admin/teams" className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <p className="text-2xl mb-2">🏟️</p>
              <p className="text-sm font-medium">管理球队</p>
            </a>
            <a href="/admin/matches" className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <p className="text-2xl mb-2">🏆</p>
              <p className="text-sm font-medium">管理赛事</p>
            </a>
            <a href="/admin/live" className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <p className="text-2xl mb-2">📡</p>
              <p className="text-sm font-medium">文字直播</p>
            </a>
            <a href="/admin/highlights" className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors">
              <p className="text-2xl mb-2">🎬</p>
              <p className="text-sm font-medium">精彩回放</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
