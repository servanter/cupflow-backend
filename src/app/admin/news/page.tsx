"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface NewsItem {
  id: number;
  title: string;
  tag: string;
  cover_url: string;
  video_url: string;
  summary: string;
  content: string;
  created_at: string;
}

const TAG_OPTIONS = ["经典回顾", "球星故事", "历届盘点", "转会动态", "战术解析"];

export default function NewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [form, setForm] = useState({
    title: "", tag: "经典回顾", cover_url: "", video_url: "", summary: "", content: "",
  });

  useEffect(() => { fetchNews(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchNews = async () => {
    const res = await fetch("/api/news?pageSize=1000");
    const data = await res.json();
    if (data.code === 200) setNewsList(data.data.list || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/admin/news/${editingItem.id}` : "/api/admin/news";
    const method = editingItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.code === 200) { setShowForm(false); setEditingItem(null); fetchNews(); }
    else alert(data.message);
  };

  const handleEdit = (item: NewsItem) => {
    setEditingItem(item);
    setForm({
      title: item.title, tag: item.tag, cover_url: item.cover_url || "",
      video_url: item.video_url || "", summary: item.summary || "", content: item.content || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchNews();
  };

  const tagColors: Record<string, string> = {
    "经典回顾": "bg-red-100 text-red-700",
    "球星故事": "bg-blue-100 text-blue-700",
    "历届盘点": "bg-green-100 text-green-700",
    "转会动态": "bg-yellow-100 text-yellow-700",
    "战术解析": "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">足球资讯 ({newsList.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditingItem(null); setForm({ title: "", tag: "经典回顾", cover_url: "", video_url: "", summary: "", content: "" }); }}>
          + 添加资讯
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingItem ? "编辑资讯" : "添加资讯"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>标题</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="资讯标题" required />
              </div>
              <div className="space-y-2">
                <Label>标签</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
                  {TAG_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>封面图片链接</Label>
                <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>视频链接（可选）</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="B站/YouTube链接" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>摘要</Label>
                <textarea className="flex w-full rounded-md border px-3 py-2 text-sm min-h-[60px]" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="一句话简介" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>详细内容</Label>
                <textarea className="flex w-full rounded-md border px-3 py-2 text-sm min-h-[120px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="资讯正文" />
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
                <TableHead>标签</TableHead>
                <TableHead>视频</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsList.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.id}</TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">{n.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${tagColors[n.tag] || ""}`}>{n.tag}</span>
                  </TableCell>
                  <TableCell>{n.video_url ? "有" : "无"}</TableCell>
                  <TableCell>{n.created_at?.split("T")[0]}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(n)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(n.id)}>删除</Button>
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
