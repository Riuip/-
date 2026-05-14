"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchBar({
  className = "",
  placeholder = "搜索帖子、社区、用户...",
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  // Sync when navigating across pages with different ?q
  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    router.push(`/search?q=${encodeURIComponent(v)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="absolute left-2.5 text-ink-mute pointer-events-none"
      >
        <circle cx="9" cy="9" r="6" />
        <line x1="14" y1="14" x2="18" y2="18" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-paper-dark/60 hover:bg-paper-dark focus:bg-white focus:border-brand border border-paper-dark rounded-full pl-8 pr-3 py-1.5 text-sm outline-none transition-colors"
      />
    </form>
  );
}
