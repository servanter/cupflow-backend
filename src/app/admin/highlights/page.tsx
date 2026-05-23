"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Highlight {
  id: number; match_id: number; title: string; type: string;
  occur_time: string; description: string; video_url: string;
  home_team_name?: string; away_team_name?: string; match_date?: string;
}

interface Match { id: number; home_team_name: string; away_team_name: string; match_date: string; }

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Highlight | null>(null);
  const [form, setForm] = useState({
    match_id: 0, title: "", type: "进球", occur_time: "", description: "", video_url: "",
  });

  useEffect(() => { fetchHighlights(); fetchMatches(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchHighlights = async () => {
    const res = await fetch("/api/highlights?pageSize=1000");
    const data = await res.json();
    if (data.code === 200) setHighlights(data.data.list || []);
  };

  const fetchMatches = async () => {
    const res = await fetch("/api/matches");
    const data = await res.json();
    if (data.code === 200) setMatches(data.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/admin/highlights/${editingItem.id}` : "/api/admin/highlights";
    const method = editingItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.code === 200) { setShowForm(false); setEditingItem(null); fetchHighlights(); }
    else alert(data.message);
  };

  const handleEdit = (item: Highlight) => {
    setEditingItem(item);
    setForm({ match_id: item.match_id, title: item.title, type: item.type, occur_time: item.occur_time, description: item.description || "", video_url: item.video_url });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/highlights/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchHighlights();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">精彩回放 ({highlights.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditingItem(null); setForm({ match_id: 0, title: "", type: "进球", occur_time: "", description: "", video_url: "" }); }}>
          + 添加回放
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingItem ? "编辑" : "添加"}精彩回放</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联比赛</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.match_id} onChange={(e) => setForm({ ...form, match_id: Number(e.target.value) })} required>
                  <option value={0}>选择比赛</option>
                  {matches.map((m) => <option key={m.id} value={m.id}>{m.home_team_name} vs {m.away_team_name} ({m.match_date?.split("T")[0]})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>标题</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="进球">进球</option>
                  <option value="扑救">扑救</option>
                  <option value="红牌">红牌</option>
                  <option value="点球">点球</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>发生时间</Label>
                <Input value={form.occur_time} onChange={(e) => setForm({ ...form, occur_time: e.target.value })} placeholder="如: 78'" required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>描述</Label>
                <textarea className="flex w-full rounded-md border px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>视频链接</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube/B站/央视等链接" required />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">{editingItem ? "保存" : "添加"}</Button>
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
                <TableHead>标题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>比赛</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highlights.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.id}</TableCell>
                  <TableCell className="font-medium">{h.title}</TableCell>
                  <TableCell>{h.type}</TableCell>
                  <TableCell>{h.home_team_name} vs {h.away_team_name}</TableCell>
                  <TableCell>{h.occur_time}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(h)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(h.id)}>删除</Button>
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
