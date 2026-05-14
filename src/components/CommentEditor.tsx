"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MarkdownEditor from "./MarkdownEditor";

export default function CommentEditor({
  commentId,
  initialBody,
  onDone,
}: {
  commentId: string;
  initialBody: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("comments")
      .update({ body: body.trim() })
      .eq("id", commentId);

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 my-2">
      <MarkdownEditor
        value={body}
        onChange={setBody}
        rows={4}
        placeholder="编辑评论..."
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-full"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
