import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import type { PostWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Auto-create the community on first visit if it doesn't exist (only for logged-in users).
  let { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!community) {
    if (user) {
      const { data: created, error } = await supabase
        .from("communities")
        .insert({
          slug: params.slug,
          name: params.slug,
          created_by: user.id,
        })
        .select()
        .single();
      if (!error) community = created;
    }
  }

  if (!community) notFound();

  const { data: posts } = await supabase
    .from("posts_with_score")
    .select("*")
    .eq("community_id", community.id)
    .order("created_at", { ascending: false })
    .limit(30);

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

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">c/{community.slug}</h1>
          {community.description && (
            <p className="text-sm text-gray-600 mt-1">{community.description}</p>
          )}
        </div>
        {user ? (
          <Link
            href={`/c/${community.slug}/submit`}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap"
          >
            Create Post
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-brand hover:underline whitespace-nowrap"
          >
            Sign in to post
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {posts && posts.length === 0 && (
          <div className="card p-6 text-sm text-gray-600">
            No posts in c/{community.slug} yet.
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
    </div>
  );
}
