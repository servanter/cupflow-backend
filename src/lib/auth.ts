import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.JWT_SECRET || "cupflow_admin_secret_key_2026";
const USER_SECRET = process.env.JWT_USER_SECRET || "cupflow_user_secret_key_2026";

// 管理员Token相关
export function signAdminToken(payload: { id: number; username: string }) {
  return jwt.sign(payload, ADMIN_SECRET, { expiresIn: "24h" });
}

export function verifyAdminToken(token: string) {
  try {
    return jwt.verify(token, ADMIN_SECRET) as { id: number; username: string };
  } catch {
    return null;
  }
}

// 前端用户Token相关
export function signUserToken(payload: { id: number; nickname: string }) {
  return jwt.sign(payload, USER_SECRET, { expiresIn: "7d" });
}

export function verifyUserToken(token: string) {
  try {
    return jwt.verify(token, USER_SECRET) as { id: number; nickname: string };
  } catch {
    return null;
  }
}

// 密码加密
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

// 密码验证
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// 从请求中提取管理员信息
export function getAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyAdminToken(token);
}

// 从请求中提取用户信息
export function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyUserToken(token);
}
