"use client";

// 监听新帖,Toast 风格徽章提示用户刷新。
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RealtimePostsBadge({
  /** Comma-separated community ids to filter; empty = all */
  scopedCommunityIds,
}: {
  scopedCommunityIds?: string[];
}) {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("posts:home")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const row = payload.new as { community_id?: string };
          if (
            scopedCommunityIds &&
            scopedCommunityIds.length > 0 &&
            row.community_id &&
            !scopedCommunityIds.includes(row.community_id)
          ) {
            return;
          }
          setCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scopedCommunityIds]);

  if (count === 0) return null;

  return (
    <button
      onClick={() => {
        setCount(0);
        router.refresh();
      }}
      className="sticky top-16 z-10 self-center mx-auto bg-brand hover:bg-brand-dark text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-ink flash-in"
    >
      ↑ 有 {count} 条新帖,点击刷新
    </button>
  );
}
