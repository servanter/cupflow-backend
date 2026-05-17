"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Team {
  id: number;
  name: string;
  flag_url: string;
  continent: string;
  world_cup_appearances: number;
  best_result: string;
  coach: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState({
    name: "",
    flag_url: "",
    continent: "",
    world_cup_appearances: 0,
    best_result: "",
    coach: "",
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    if (data.code === 200) setTeams(data.data);
  };

  const getToken = () => localStorage.getItem("admin_token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTeam ? `/api/admin/teams/${editingTeam.id}` : "/api/admin/teams";
    const method = editingTeam ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.code === 200) {
      setShowForm(false);
      setEditingTeam(null);
      setForm({ name: "", flag_url: "", continent: "", world_cup_appearances: 0, best_result: "", coach: "" });
      fetchTeams();
    } else {
      alert(data.message);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      flag_url: team.flag_url,
      continent: team.continent,
      world_cup_appearances: team.world_cup_appearances,
      best_result: team.best_result,
      coach: team.coach,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该球队？")) return;
    const res = await fetch(`/api/admin/teams/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const data = await res.json();
    if (data.code === 200) fetchTeams();
    else alert(data.message);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">球队列表 ({teams.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditingTeam(null); setForm({ name: "", flag_url: "", continent: "", world_cup_appearances: 0, best_result: "", coach: "" }); }}>
          + 添加球队
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTeam ? "编辑球队" : "添加球队"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>球队名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>国旗URL</Label>
                <Input value={form.flag_url} onChange={(e) => setForm({ ...form, flag_url: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>所属大洲</Label>
                <Input value={form.continent} onChange={(e) => setForm({ ...form, continent: e.target.value })} placeholder="亚洲/欧洲/非洲/南美洲/北美洲/大洋洲" required />
              </div>
              <div className="space-y-2">
                <Label>参赛次数</Label>
                <Input type="number" value={form.world_cup_appearances} onChange={(e) => setForm({ ...form, world_cup_appearances: Number(e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <Label>最佳成绩</Label>
                <Input value={form.best_result} onChange={(e) => setForm({ ...form, best_result: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>主教练</Label>
                <Input value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} required />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">{editingTeam ? "保存" : "添加"}</Button>
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
                <TableHead>国旗</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>大洲</TableHead>
                <TableHead>参赛次数</TableHead>
                <TableHead>最佳成绩</TableHead>
                <TableHead>主教练</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.id}</TableCell>
                  <TableCell>
                    {team.flag_url && <img src={team.flag_url} alt={team.name} className="w-8 h-5 object-cover" />}
                  </TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.continent}</TableCell>
                  <TableCell>{team.world_cup_appearances}</TableCell>
                  <TableCell>{team.best_result}</TableCell>
                  <TableCell>{team.coach}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(team)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(team.id)}>删除</Button>
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
