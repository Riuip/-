"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function JoinCommunityButton({
  communityId,
  isLoggedIn,
  initialJoined,
}: {
  communityId: string;
  isLoggedIn: boolean;
  initialJoined: boolean;
}) {
  const router = useRouter();
  const [joined, setJoined] = useState(initialJoined);
  const [hover, setHover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    // Optimistic update
    const prev = joined;
    setJoined(!joined);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setJoined(prev);
      setLoading(false);
      router.push("/login");
      return;
    }

    if (prev) {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("community_id", communityId);
      if (error) {
        setJoined(prev);
        alert("退出失败: " + error.message);
      }
    } else {
      const { error } = await supabase
        .from("community_members")
        .insert({ user_id: user.id, community_id: communityId });
      if (error) {
        setJoined(prev);
        alert("加入失败: " + error.message);
      }
    }

    setLoading(false);
    startTransition(() => router.refresh());
  }

  // Visual states: not joined -> "加入" gold | joined -> "已加入" outline | joined+hover -> "退出" red
  const label = !joined ? "加入" : hover ? "退出" : "已加入";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`text-sm font-semibold px-5 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 disabled:opacity-60 ${
        !joined
          ? "bg-accent hover:bg-accent-600 text-white shadow-sm hover:shadow-md"
          : hover
            ? "bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
            : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
      }`}
    >
      {loading ? "..." : label}
    </button>
  );
}
