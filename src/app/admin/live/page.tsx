"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Match { id: number; home_team_name: string; away_team_name: string; match_date: string; status: string; }
interface LiveMessage { id: number; match_id: number; time: string; type: string; content: string; created_at: string; }

export default function LivePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number>(0);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [form, setForm] = useState({ time: "", type: "普通", content: "" });

  useEffect(() => { fetchMatches(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchMatches = async () => {
    const res = await fetch("/api/matches");
    const data = await res.json();
    if (data.code === 200) setMatches(data.data);
  };

  const fetchMessages = async (matchId: number) => {
    const res = await fetch(`/api/live/${matchId}`);
    const data = await res.json();
    if (data.code === 200) setMessages(data.data);
  };

  const handleSelectMatch = (matchId: number) => {
    setSelectedMatchId(matchId);
    fetchMessages(matchId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) { alert("请先选择比赛"); return; }

    const res = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ match_id: selectedMatchId, ...form }),
    });
    const data = await res.json();
    if (data.code === 200) {
      setForm({ time: "", type: "普通", content: "" });
      fetchMessages(selectedMatchId);
    } else alert(data.message);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/live/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchMessages(selectedMatchId);
  };

  const typeColors: Record<string, string> = {
    "普通": "bg-gray-100", "进球": "bg-green-100 text-green-700",
    "黄牌": "bg-yellow-100 text-yellow-700", "红牌": "bg-red-100 text-red-700", "换人": "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label>选择比赛</Label>
          <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={selectedMatchId} onChange={(e) => handleSelectMatch(Number(e.target.value))}>
            <option value={0}>请选择比赛</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.status}] {m.home_team_name} vs {m.away_team_name} ({m.match_date?.split("T")[0]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMatchId > 0 && (
        <>
          <Card>
            <CardHeader><CardTitle>发布直播消息</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>时间</Label>
                  <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="如: 45'" className="w-24" required />
                </div>
                <div className="space-y-2">
                  <Label>类型</Label>
                  <select className="flex h-10 rounded-md border px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="普通">普通</option>
                    <option value="进球">进球⚽</option>
                    <option value="黄牌">黄牌🟨</option>
                    <option value="红牌">红牌🟥</option>
                    <option value="换人">换人🔄</option>
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>内容</Label>
                  <Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="直播内容..." required />
                </div>
                <Button type="submit">发布</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>直播消息列表 ({messages.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">时间</TableHead>
                    <TableHead className="w-20">类型</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead className="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="font-mono">{msg.time}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${typeColors[msg.type] || ""}`}>{msg.type}</span>
                      </TableCell>
                      <TableCell>{msg.content}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(msg.id)}>删除</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
