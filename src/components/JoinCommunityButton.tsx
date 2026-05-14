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
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (joined) {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("community_id", communityId);
      if (!error) setJoined(false);
      else alert("退出失败:" + error.message);
    } else {
      const { error } = await supabase
        .from("community_members")
        .insert({ user_id: user.id, community_id: communityId });
      if (!error) setJoined(true);
      else alert("加入失败:" + error.message);
    }

    setLoading(false);
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${
        joined
          ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
          : "bg-brand hover:bg-brand-dark text-white"
      } disabled:opacity-60`}
    >
      {loading ? "..." : joined ? "已加入" : "加入"}
    </button>
  );
}
