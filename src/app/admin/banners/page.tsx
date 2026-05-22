"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url_mp: string;
  link_url_h5: string;
  sort_order: number;
  is_active: number;
  created_at: string;
}

const emptyForm = { title: "", image_url: "", link_url_mp: "", link_url_h5: "", sort_order: 0, is_active: 1 };

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Banner | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { fetchBanners(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchBanners = async () => {
    const res = await fetch("/api/admin/banners", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    if (data.code === 200) setBanners(data.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/admin/banners/${editingItem.id}` : "/api/admin/banners";
    const method = editingItem ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.code === 200) {
      setShowForm(false);
      setEditingItem(null);
      setForm({ ...emptyForm });
      fetchBanners();
    } else {
      alert(data.message);
    }
  };

  const handleEdit = (item: Banner) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      image_url: item.image_url,
      link_url_mp: item.link_url_mp || "",
      link_url_h5: item.link_url_h5 || "",
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该 Banner？")) return;
    await fetch(`/api/admin/banners/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchBanners();
  };

  const toggleActive = async (item: Banner) => {
    await fetch(`/api/admin/banners/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ ...item, is_active: item.is_active ? 0 : 1 }),
    });
    fetchBanners();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Banner 管理 ({banners.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditingItem(null); setForm({ ...emptyForm }); }}>
          + 添加 Banner
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? "编辑 Banner" : "添加 Banner"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>图片链接 *</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
                {form.image_url && (
                  <img src={form.image_url} alt="预览" className="w-full max-h-40 object-cover rounded-md mt-2" />
                )}
              </div>
              <div className="col-span-2 space-y-2">
                <Label>标题（可选）</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Banner 标题"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>跳转链接 · 小程序（填内部页面路径，留空则不跳转）</Label>
                <Input
                  value={form.link_url_mp}
                  onChange={(e) => setForm({ ...form, link_url_mp: e.target.value })}
                  placeholder="/pages/news/index"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>跳转链接 · H5（填完整 URL 或内部路径，留空则不跳转）</Label>
                <Input
                  value={form.link_url_h5}
                  onChange={(e) => setForm({ ...form, link_url_h5: e.target.value })}
                  placeholder="https://example.com 或 /pages/news/index"
                />
              </div>
              <div className="space-y-2">
                <Label>排序（数字越小越靠前）</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <select
                  className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}
                >
                  <option value={1}>上线</option>
                  <option value={0}>下线</option>
                </select>
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
                <TableHead>预览</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>小程序链接</TableHead>
                <TableHead>H5链接</TableHead>
                <TableHead>排序</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.id}</TableCell>
                  <TableCell>
                    <img src={b.image_url} alt={b.title} className="w-24 h-12 object-cover rounded" />
                  </TableCell>
                  <TableCell className="font-medium">{b.title || "—"}</TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[140px] truncate">{b.link_url_mp || "—"}</TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[140px] truncate">{b.link_url_h5 || "—"}</TableCell>
                  <TableCell>{b.sort_order}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                        b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                      onClick={() => toggleActive(b)}
                    >
                      {b.is_active ? "上线" : "下线"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(b)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>删除</Button>
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
