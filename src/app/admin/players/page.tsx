"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Player {
  id: number;
  name: string;
  photo_url: string;
  team_id: number;
  birth_date: string;
  height: string;
  position: string;
  club: string;
  goals: number;
  assists: number;
}

interface Team {
  id: number;
  name: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState({
    name: "", photo_url: "", team_id: 0, birth_date: "", height: "", position: "", club: "", goals: 0, assists: 0,
  });

  useEffect(() => {
    fetchPlayers();
    fetchTeams();
  }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchPlayers = async () => {
    const res = await fetch("/api/admin/players", { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.code === 200) setPlayers(data.data);
  };

  const fetchTeams = async () => {
    const res = await fetch("/api/teams");
    const data = await res.json();
    if (data.code === 200) setTeams(data.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPlayer ? `/api/admin/players/${editingPlayer.id}` : "/api/admin/players";
    const method = editingPlayer ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.code === 200) {
      setShowForm(false);
      setEditingPlayer(null);
      fetchPlayers();
    } else alert(data.message);
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setForm({
      name: player.name, photo_url: player.photo_url, team_id: player.team_id,
      birth_date: player.birth_date?.split("T")[0] || "", height: player.height,
      position: player.position, club: player.club, goals: player.goals, assists: player.assists,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/players/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchPlayers();
  };

  const getTeamName = (teamId: number) => teams.find((t) => t.id === teamId)?.name || "未知";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">球员列表 ({players.length})</h2>
        <Button onClick={() => { setShowForm(true); setEditingPlayer(null); setForm({ name: "", photo_url: "", team_id: 0, birth_date: "", height: "", position: "", club: "", goals: 0, assists: 0 }); }}>
          + 添加球员
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingPlayer ? "编辑球员" : "添加球员"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>头像URL</Label>
                <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>所属球队</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.team_id} onChange={(e) => setForm({ ...form, team_id: Number(e.target.value) })} required>
                  <option value={0}>选择球队</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>出生日期</Label>
                <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>身高</Label>
                <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="如: 180cm" required />
              </div>
              <div className="space-y-2">
                <Label>位置</Label>
                <select className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required>
                  <option value="">选择位置</option>
                  <option value="门将">门将</option>
                  <option value="后卫">后卫</option>
                  <option value="中场">中场</option>
                  <option value="前锋">前锋</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>俱乐部</Label>
                <Input value={form.club} onChange={(e) => setForm({ ...form, club: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>进球数</Label>
                <Input type="number" value={form.goals} onChange={(e) => setForm({ ...form, goals: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>助攻数</Label>
                <Input type="number" value={form.assists} onChange={(e) => setForm({ ...form, assists: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit">{editingPlayer ? "保存" : "添加"}</Button>
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
                <TableHead>姓名</TableHead>
                <TableHead>球队</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>俱乐部</TableHead>
                <TableHead>进球</TableHead>
                <TableHead>助攻</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>{player.id}</TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{getTeamName(player.team_id)}</TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>{player.club}</TableCell>
                  <TableCell>{player.goals}</TableCell>
                  <TableCell>{player.assists}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(player)}>编辑</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(player.id)}>删除</Button>
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
