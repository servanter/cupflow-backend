"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Comment {
  id: number; match_id: number; nickname: string; content: string; likes: number; created_at: string;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => { fetchComments(); }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchComments = async () => {
    const res = await fetch("/api/admin/comments", { headers: { Authorization: `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.code === 200) setComments(data.data);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除该评论？")) return;
    await fetch(`/api/admin/comments/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    fetchComments();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">评论管理 ({comments.length})</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>比赛ID</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>点赞</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.match_id}</TableCell>
                  <TableCell>{c.nickname}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.content}</TableCell>
                  <TableCell>{c.likes}</TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>删除</Button>
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
