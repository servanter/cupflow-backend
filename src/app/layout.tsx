import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CupFlow - 世界杯赛事管理后台",
  description: "世界杯赛事网站管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
