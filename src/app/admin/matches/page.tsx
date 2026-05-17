"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
  status: string;
  match_time: string;
  match_date: string;
  stage: string;
  group_name: string;
  home_team_name?: string;
  away_team_name?: string;
}

interface Team { id: number; name: string; }

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [form, setForm] = useState({
    home_team_id: 0, away_team_id: 0, home_score: 0, away_score: 0,
    status: "未开始", match_time: "", match_date: "", stage: "小组赛", group_name: "",
  });

  useEffect(() => { fetchMatches(); fetchTeams(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchMatches = async () => {
    const res = await fetch("/api/matches");
    const data = await res.json();
    if (data.code === 200) setMatches(data.data);
  };

  const fetchTeams = async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    if (data.code === 200) setTeams(data.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingMatch ? `/api/admin/matches/${editingMatch.id}` : "/api/admin/matches";
    const method = editingMatch ? "PUT" : "POST";

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.code === 200) { setShowForm(false); setEditingMatch(null); fetchMatches(); }
    else alert(data.message);
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setForm({
      home_team_id: match.home_team_id, away_team_id: match.away_team_id,
      home_score: match.home_score, away_score: match.away_score,
      status: match.status, match_time: match.match_time,
      match_date: match.match_date?.split("T")[0] || "", stage: match.stage, group_name: match.group_name || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/matches/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchMatches();
  };

  const statusColors: Record<string, string> = {
    "未开始": "bg-gray-100 text-gray-700",
    "进行中": "bg-green-100 text-green-700",
    "已结束": "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">赛事列表 ({matches.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditingMatch(null); setForm({ home_team_id: 0, away_team_id: 0, home_score: 0, away_score: 0, status: "未开始", match_time: "", match_date: "", stage: "小组赛", group_name: "" }); }}>
          + 添加赛事
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingMatch ? "编辑赛事" : "添加赛事"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主队</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.home_team_id} onChange={(e) => setForm({ ...form, home_team_id: Number(e.target.value) })} required>
                  <option value={0}>选择主队</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>客队</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.away_team_id} onChange={(e) => setForm({ ...form, away_team_id: Number(e.target.value) })} required>
                  <option value={0}>选择客队</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>比赛日期</Label>
                <Input type="date" value={form.match_date} onChange={(e) => setForm({ ...form, match_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>开赛时间</Label>
                <Input value={form.match_time} onChange={(e) => setForm({ ...form, match_time: e.target.value })} placeholder="如: 21:00" required />
              </div>
              <div className="space-y-2">
                <Label>赛事阶段</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
                  <option value="小组赛">小组赛</option>
                  <option value="1/8决赛">1/8决赛</option>
                  <option value="1/4决赛">1/4决赛</option>
                  <option value="半决赛">半决赛</option>
                  <option value="三四名决赛">三四名决赛</option>
                  <option value="决赛">决赛</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>小组</Label>
                <Input value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} placeholder="如: A组（仅小组赛填写）" />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="未开始">未开始</option>
                  <option value="进行中">进行中</option>
                  <option value="已结束">已结束</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>主队比分</Label>
                <Input type="number" value={form.home_score} onChange={(e) => setForm({ ...form, home_score: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>客队比分</Label>
                <Input type="number" value={form.away_score} onChange={(e) => setForm({ ...form, away_score: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">{editingMatch ? "保存" : "添加"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>取消</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>对阵</TableHead>
                <TableHead>比分</TableHead>
                <TableHead>阶段</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.id}</TableCell>
                  <TableCell>{m.match_date?.split("T")[0]}</TableCell>
                  <TableCell>{m.match_time}</TableCell>
                  <TableCell className="font-medium">{m.home_team_name} vs {m.away_team_name}</TableCell>
                  <TableCell>{m.home_score} : {m.away_score}</TableCell>
                  <TableCell>{m.stage}{m.group_name ? ` (${m.group_name})` : ""}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[m.status] || ""}`}>{m.status}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(m.id)}>删除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
