"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: number; nickname: string; points: number; created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => { fetchUsers(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.code === 200) setUsers(data.data);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该用户？")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">用户管理 ({users.length})</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>积分</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.nickname}</TableCell>
                  <TableCell>{u.points}</TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>删除</Button>
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
