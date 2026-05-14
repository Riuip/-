"use client";

// 顶部红色横幅:
//   - 拉 /api/hotnews 获取中国热点
//   - 4 秒自动轮播下一条 (鼠标悬停时暂停)
//   - 每 5 分钟自动刷新数据
//   - 左右箭头手动切换 / 点击标题打开原链接
import { useEffect, useRef, useState } from "react";

type NewsItem = {
  title: string;
  url: string;
  index?: number;
  hot?: string;
};

type ApiResponse = {
  items: NewsItem[];
  source: string | null;
  updated_at?: string;
  stale?: boolean;
  error?: string;
};

const ROTATE_MS = 4000;
const REFRESH_MS = 5 * 60 * 1000;

export default function HotNewsBanner() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0); // re-trigger slide-in
  const fetchRef = useRef<number | null>(null);

  // ---- fetch ----
  async function load() {
    try {
      const r = await fetch("/api/hotnews", { cache: "no-store" });
      if (!r.ok) return;
      const json = (await r.json()) as ApiResponse;
      if (json.items.length > 0) {
        setData(json);
        setIdx((prev) => (prev >= json.items.length ? 0 : prev));
      }
    } catch {
      // ignore - keep showing the previous snapshot
    }
  }

  useEffect(() => {
    load();
    fetchRef.current = window.setInterval(load, REFRESH_MS);
    return () => {
      if (fetchRef.current) window.clearInterval(fetchRef.current);
    };
  }, []);

  // ---- auto rotate ----
  useEffect(() => {
    if (!data || data.items.length < 2 || paused) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % data.items.length);
      setAnimKey((k) => k + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [data, paused]);

  if (!data || data.items.length === 0) {
    // First-load skeleton (kept very small so it doesn't shift layout much).
    return (
      <div className="bg-gradient-to-r from-brand-700 via-brand to-brand-700 text-white">
        <div className="max-w-6xl mx-auto px-4 h-9 flex items-center text-xs sm:text-sm">
          <span className="font-semibold mr-2">🔥 热点</span>
          <span className="opacity-70">加载中...</span>
        </div>
      </div>
    );
  }

  const cur = data.items[idx];
  const total = data.items.length;

  function go(delta: number) {
    setIdx((i) => (i + delta + total) % total);
    setAnimKey((k) => k + 1);
  }

  return (
    <div
      className="bg-gradient-to-r from-brand-700 via-brand to-brand-700 text-white shadow-sm relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 左侧花纹 */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-32 opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 0 50%, rgba(251,227,132,0.8) 0%, transparent 60%)",
        }}
      />
      <div className="max-w-6xl mx-auto px-4 h-9 sm:h-10 flex items-center gap-2 text-xs sm:text-sm relative">
        {/* 标签 */}
        <span className="flex items-center gap-1 shrink-0 font-semibold">
          <span className="text-base">🔥</span>
          <span className="hidden sm:inline">{data.source ?? "热搜"}</span>
        </span>

        {/* 排名徽标 */}
        <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold tabular-nums">
          {cur.index ?? idx + 1}
        </span>

        {/* 标题 (轮播) */}
        <a
          key={animKey}
          href={cur.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-0 truncate hover:underline animate-[ticker_400ms_ease-out]"
          title={cur.title}
        >
          {cur.title}
        </a>

        {/* 控件 */}
        <div className="shrink-0 flex items-center gap-1 text-white/80">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="上一条"
            className="px-1.5 py-0.5 rounded hover:bg-white/15"
          >
            ‹
          </button>
          <span className="text-[11px] tabular-nums hidden sm:inline">
            {idx + 1}/{total}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="下一条"
            className="px-1.5 py-0.5 rounded hover:bg-white/15"
          >
            ›
          </button>
          {data.stale && (
            <span
              className="ml-1 text-[10px] px-1 py-0.5 rounded bg-white/15"
              title="使用缓存数据"
            >
              缓存
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          from {
            transform: translateY(80%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
