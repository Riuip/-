"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MarkAllReadButton({ ids }: { ids: string[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (ids.length === 0) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids);
    setLoading(false);
    if (error) {
      alert("操作失败:" + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
    >
      {loading ? "处理中..." : "全部标为已读"}
    </button>
  );
}
