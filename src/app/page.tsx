import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import type { PostWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Latest 30 posts across all communities.
  const { data: posts, error } = await supabase
    .from("posts_with_score")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  // Current user's votes for those posts (so we can highlight up/down).
  let userVotes: Record<string, -1 | 1> = {};
  if (user && posts && posts.length > 0) {
    const ids = posts.map((p) => p.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("post_id, value")
      .eq("user_id", user.id)
      .in("post_id", ids);
    for (const v of votes ?? []) {
      if (v.post_id) userVotes[v.post_id] = v.value as -1 | 1;
    }
  }

  // Sidebar: recent communities.
  const { data: communities } = await supabase
    .from("communities")
    .select("slug, name")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
      <div className="space-y-3">
        {error && (
          <div className="card p-4 text-sm text-red-600">
            Failed to load posts: {error.message}
          </div>
        )}

        {posts && posts.length === 0 && (
          <div className="card p-6 text-sm text-gray-600">
            No posts yet.{" "}
            {user ? (
              <>
                Pick a community on the right or{" "}
                <Link href="/c/general" className="text-brand hover:underline">
                  visit c/general
                </Link>{" "}
                to write the first post.
              </>
            ) : (
              <>
                <Link href="/login" className="text-brand hover:underline">
                  Sign in
                </Link>{" "}
                to start posting.
              </>
            )}
          </div>
        )}

        {(posts as PostWithScore[] | null)?.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userVote={userVotes[post.id] ?? 0}
            isLoggedIn={!!user}
          />
        ))}
      </div>

      <aside className="space-y-3">
        <div className="card p-4">
          <h2 className="font-semibold text-sm mb-2">Communities</h2>
          {communities && communities.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {communities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/c/${c.slug}`}
                    className="text-gray-800 hover:underline"
                  >
                    c/{c.slug}
                  </Link>{" "}
                  <span className="text-gray-500">- {c.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No communities yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
