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
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="absolute left-3 text-gray-500 pointer-events-none"
      >
        <path fillRule="evenodd" d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04Z" />
      </svg>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 dark:bg-gray-800/80 hover:bg-gray-700 focus:bg-gray-700 border border-gray-700 focus:border-accent-500 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 outline-none transition-all focus:ring-1 focus:ring-accent-500/50"
      />
    </form>
  );
}
