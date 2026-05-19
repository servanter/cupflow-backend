import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: "未登录" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { code: 400, message: "请选择图片文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { code: 400, message: "仅支持 jpg/png/gif/webp 格式" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { code: 400, message: "图片大小不能超过 2MB" },
        { status: 400 }
      );
    }

    // 生成文件名
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}_${Date.now()}.${ext}`;

    // 确保目录存在
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    await mkdir(uploadDir, { recursive: true });

    // 写入文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, fileName), buffer);

    // 返回可访问的 URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    return NextResponse.json({
      code: 200,
      message: "上传成功",
      data: { avatarUrl },
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { code: 500, message: "服务器内部错误" },
      { status: 500 }
    );
  }
}
