import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { LeftDecorPanel, RightDecorPanel } from "@/components/decor/SidePanels";

export const metadata: Metadata = {
  title: {
    default: "论坛 · 以文会友",
    template: "%s · 论坛",
  },
  description:
    "一个具有中华文化感的开源中文论坛,支持发帖、评论、投票、Markdown、图片上传、实时更新。基于 Next.js + Supabase。",
  openGraph: {
    type: "website",
    siteName: "论坛",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <Navbar />
        <LeftDecorPanel />
        <RightDecorPanel />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
