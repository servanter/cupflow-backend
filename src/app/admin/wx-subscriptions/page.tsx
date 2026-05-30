"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Status = "all" | "pending" | "sent" | "failed";

interface Subscription {
  id: number;
  user_id: number;
  user_nickname: string;
  openid: string;
  match_id: number;
  match_teams: string;
  title: string;
  match_time: string;
  send_time: string;
  status: "pending" | "sent" | "failed";
  created_at: string;
}

interface Stats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
}

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: "待发送", className: "bg-yellow-100 text-yellow-800" },
  sent:    { text: "已发送", className: "bg-green-100 text-green-800" },
  failed:  { text: "发送失败", className: "bg-red-100 text-red-800" },
};

export default function WxSubscriptionsPage() {
  const [list, setList] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, sent: 0, failed: 0 });
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const limit = 20;

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchData = async (status: Status = statusFilter, p: number = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/admin/wx-subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.code === 200) {
        setList(data.data.list);
        setTotal(data.data.total);
        setStats(data.data.stats);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusFilter = (s: Status) => {
    setStatusFilter(s);
    setPage(1);
    fetchData(s, 1);
  };

  const handleResend = async (id: number) => {
    if (!confirm("确定重新发送该提醒？")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/wx-subscriptions/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.code === 200) {
        alert("重发成功");
        fetchData();
      } else {
        alert(`重发失败: ${data.message}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该记录？")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/wx-subscriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      fetchData();
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatTime = (t: string) =>
    t ? new Date(t).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">微信提醒管理</h2>
        <Button variant="outline" size="sm" onClick={() => fetchData()}>
          🔄 刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "全部", value: stats.total, key: "all", color: "text-gray-700", bg: "bg-white" },
          { label: "待发送", value: stats.pending, key: "pending", color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "已发送", value: stats.sent, key: "sent", color: "text-green-700", bg: "bg-green-50" },
          { label: "发送失败", value: stats.failed, key: "failed", color: "text-red-700", bg: "bg-red-50" },
        ].map((item) => (
          <Card
            key={item.key}
            className={`cursor-pointer border-2 transition-all ${
              statusFilter === item.key ? "border-blue-500 shadow-md" : "border-transparent"
            } ${item.bg}`}
            onClick={() => handleStatusFilter(item.key as Status)}
          >
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-sm text-gray-500 mt-1">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 表格 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>比赛</TableHead>
                  <TableHead>提醒标题</TableHead>
                  <TableHead>比赛时间</TableHead>
                  <TableHead>计划发送</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>订阅时间</TableHead>
                  <TableHead className="w-32">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-gray-400 text-xs">{sub.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{sub.user_nickname || "-"}</div>
                      <div className="text-xs text-gray-400">{sub.openid.slice(0, 10)}...</div>
                    </TableCell>
                    <TableCell className="text-sm">{sub.match_teams || `#${sub.match_id}`}</TableCell>
                    <TableCell className="text-sm max-w-[140px] truncate" title={sub.title}>
                      {sub.title}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatTime(sub.match_time)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatTime(sub.send_time)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABEL[sub.status]?.className}`}>
                        {STATUS_LABEL[sub.status]?.text || sub.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(sub.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {sub.status !== "sent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-2"
                            disabled={actionLoading === sub.id}
                            onClick={() => handleResend(sub.id)}
                          >
                            {actionLoading === sub.id ? "..." : "重发"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-7 px-2"
                          disabled={actionLoading === sub.id}
                          onClick={() => handleDelete(sub.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>共 {total} 条记录</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => { setPage(page - 1); fetchData(statusFilter, page - 1); }}
            >
              上一页
            </Button>
            <span className="px-3 py-1 bg-white border rounded text-gray-700">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => { setPage(page + 1); fetchData(statusFilter, page + 1); }}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
