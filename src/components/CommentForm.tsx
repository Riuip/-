"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  postId: string;
  parentId?: string | null;
  onDone?: () => void;
  autoFocus?: boolean;
};

export default function CommentForm({
  postId,
  parentId = null,
  onDone,
  autoFocus,
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
    <form onSubmit={handleSubmit} className="space-y-2 mb-3">
      <textarea
        placeholder={parentId ? "Write a reply..." : "Write a comment..."}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        autoFocus={autoFocus}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-full"
        >
          {loading ? "..." : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}
