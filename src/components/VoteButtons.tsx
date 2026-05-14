"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** Either postId or commentId must be provided. */
  postId?: string;
  commentId?: string;
  initialScore: number;
  /** Current user's existing vote value, or 0 if none/not logged in. */
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

    // Toggle off if clicking the same direction.
    const newValue: -1 | 0 | 1 = userVote === next ? 0 : next;
    const delta = newValue - userVote;

    // Optimistic UI.
    setUserVote(newValue);
    setScore((s) => s + delta);

    const target = postId
      ? { post_id: postId, comment_id: null }
      : { post_id: null, comment_id: commentId! };

    if (newValue === 0) {
      // Remove the vote.
      const q = supabase.from("votes").delete().eq("user_id", user.id);
      const { error } = postId
        ? await q.eq("post_id", postId).is("comment_id", null)
        : await q.eq("comment_id", commentId!).is("post_id", null);
      if (error) console.error(error);
    } else {
      // Upsert (composite PK = user_id + post_id + comment_id).
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
    <div className="flex flex-col items-center w-10 select-none">
      <button
        aria-label="Upvote"
        onClick={() => vote(1)}
        className={`p-1 rounded hover:bg-gray-100 ${
          userVote === 1 ? "text-brand" : "text-gray-500"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 4l6 7H4l6-7z" />
        </svg>
      </button>
      <span
        className={`text-xs font-semibold ${
          userVote === 1
            ? "text-brand"
            : userVote === -1
              ? "text-blue-500"
              : "text-gray-700"
        }`}
      >
        {score}
      </span>
      <button
        aria-label="Downvote"
        onClick={() => vote(-1)}
        className={`p-1 rounded hover:bg-gray-100 ${
          userVote === -1 ? "text-blue-500" : "text-gray-500"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 16l-6-7h12l-6 7z" />
        </svg>
      </button>
    </div>
  );
}
