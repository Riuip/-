"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePostButton({
  postId,
  redirectTo,
}: {
  postId: string;
  /** Where to navigate after delete. Defaults to refresh(). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("确认删除这个帖子?该操作无法撤销。")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    setLoading(false);
    if (error) {
      alert("删除失败:" + error.message);
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-500 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? "删除中..." : "删除"}
    </button>
  );
}
