"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MarkdownEditor from "./MarkdownEditor";

type Props = {
  postId: string;
  parentId?: string | null;
  onDone?: () => void;
};

export default function CommentForm({
  postId,
  parentId = null,
  onDone,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      parent_id: parentId,
      author_id: user.id,
      body: body.trim(),
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    setBody("");
    onDone?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-4">
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder={
          parentId
            ? "写下你的回复... (支持 Markdown、@提及和图片)"
            : "写下你的评论... (支持 Markdown、@提及和图片)"
        }
        rows={4}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
        >
          {loading ? "发送中..." : parentId ? "回复" : "发表评论"}
        </button>
      </div>
    </form>
  );
}
