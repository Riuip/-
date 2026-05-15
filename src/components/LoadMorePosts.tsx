"use client";

// Infinite scroll: Observes a sentinel element and fetches the next page of posts.
// Uses Supabase client to query `posts_with_score` ordered by the current sort mode.
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PostCard from "./PostCard";
import type { PostWithScore, SortMode } from "@/lib/types";

const PAGE_SIZE = 20;

type Props = {
  /** IDs of posts already shown (initial server-rendered page). */
  initialPostIds: string[];
  sort: SortMode;
  /** If scoped to a community. */
  communityId?: string;
  /** If scoped to user's joined communities. */
  joinedCommunityIds?: string[];
  isLoggedIn: boolean;
  currentUserId?: string | null;
};

export default function LoadMorePosts({
  initialPostIds,
  sort,
  communityId,
  joinedCommunityIds,
  isLoggedIn,
  currentUserId,
}: Props) {
  const [posts, setPosts] = useState<PostWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const offsetRef = useRef(initialPostIds.length);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);

    const supabase = createClient();
    let query = supabase
      .from("posts_with_score")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offsetRef.current, offsetRef.current + PAGE_SIZE - 1);

    if (communityId) {
      query = query.eq("community_id", communityId);
    } else if (joinedCommunityIds && joinedCommunityIds.length > 0) {
      query = query.in("community_id", joinedCommunityIds);
    }

    const { data } = await query;
    const newPosts = (data ?? []) as PostWithScore[];

    if (newPosts.length < PAGE_SIZE) {
      setDone(true);
    }

    // Filter out posts already shown in initial render
    const allKnown = new Set([
      ...initialPostIds,
      ...posts.map((p) => p.id),
    ]);
    const fresh = newPosts.filter((p) => !allKnown.has(p.id));

    setPosts((prev) => [...prev, ...fresh]);
    offsetRef.current += PAGE_SIZE;
    setLoading(false);
  }, [loading, done, communityId, joinedCommunityIds, initialPostIds, posts]);

  // IntersectionObserver to auto-load when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0 && done) return null;

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userVote={0}
          isLoggedIn={isLoggedIn}
          currentUserId={currentUserId}
        />
      ))}

      {/* Sentinel */}
      <div ref={sentinelRef} className="py-4 text-center">
        {loading && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            加载中...
          </div>
        )}
        {done && posts.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">— 已到底部 —</p>
        )}
      </div>
    </>
  );
}
