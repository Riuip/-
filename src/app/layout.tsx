import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "论坛 · Forum",
    template: "%s · 论坛",
  },
  description:
    "一个 Reddit 风格的中文社区论坛,支持发帖、评论、投票、Markdown、图片上传。基于 Next.js + Supabase 构建。",
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
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
