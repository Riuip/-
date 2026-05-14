"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteCommentButton({
  commentId,
}: {
  commentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("确认删除这条评论?")) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    setLoading(false);
    if (error) {
      alert("删除失败:" + error.message);
      return;
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? "..." : "删除"}
    </button>
  );
}
