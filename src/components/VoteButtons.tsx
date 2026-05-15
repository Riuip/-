"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  postId?: string;
  commentId?: string;
  initialScore: number;
  initialUserVote?: -1 | 0 | 1;
  isLoggedIn: boolean;
};

export default function VoteButtons({
  postId,
  commentId,
  initialScore,
  initialUserVote = 0,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<-1 | 0 | 1>(initialUserVote);
  const [, startTransition] = useTransition();

  async function vote(next: -1 | 1) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const newValue: -1 | 0 | 1 = userVote === next ? 0 : next;
    const delta = newValue - userVote;

    setUserVote(newValue);
    setScore((s) => s + delta);

    if (newValue === 0) {
      const q = supabase.from("votes").delete().eq("user_id", user.id);
      const { error } = postId
        ? await q.eq("post_id", postId).is("comment_id", null)
        : await q.eq("comment_id", commentId!).is("post_id", null);
      if (error) console.error(error);
    } else {
      const target = postId
        ? { post_id: postId, comment_id: null }
        : { post_id: null, comment_id: commentId! };
      const { error } = await supabase.from("votes").upsert(
        {
          user_id: user.id,
          ...target,
          value: newValue,
        },
        { onConflict: "user_id,post_id,comment_id" },
      );
      if (error) console.error(error);
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-center gap-0.5 select-none">
      <button
        aria-label="顶"
        onClick={() => vote(1)}
        className={`p-1 rounded-md transition-colors ${
          userVote === 1
            ? "text-accent bg-accent-100/50 dark:bg-accent-900/30"
            : "text-gray-400 dark:text-gray-500 hover:text-accent hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 10l4-6 4 6H4Z" />
        </svg>
      </button>
      <span
        className={`text-xs font-bold tabular-nums ${
          userVote === 1
            ? "text-accent"
            : userVote === -1
              ? "text-blue-500"
              : "text-gray-700 dark:text-gray-300"
        }`}
      >
        {score}
      </span>
      <button
        aria-label="踩"
        onClick={() => vote(-1)}
        className={`p-1 rounded-md transition-colors ${
          userVote === -1
            ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30"
            : "text-gray-400 dark:text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12 6L8 12 4 6h8Z" />
        </svg>
      </button>
    </div>
  );
}
