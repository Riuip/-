import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import SortTabs from "@/components/SortTabs";
import JoinCommunityButton from "@/components/JoinCommunityButton";
import type { PostWithScore } from "@/lib/types";
import { parseSort, sortPosts } from "@/lib/sort";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: c } = await supabase
    .from("communities")
    .select("slug, name, description")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!c) return { title: "社区未找到" };
  return {
    title: `c/${c.slug}`,
    description: c.description ?? `c/${c.slug} 社区`,
  };
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { sort?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: community } = await supabase
    .from("communities_with_stats")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!community) notFound();

  const sort = parseSort(searchParams.sort);

  const { data: rawPosts } = await supabase
    .from("posts_with_score")
    .select("*")
    .eq("community_id", community.id)
    .order("created_at", { ascending: false })
    .limit(60);
  const posts = sortPosts((rawPosts ?? []) as PostWithScore[], sort);

  const userVotes: Record<string, -1 | 1> = {};
  let isJoined = false;
  if (user) {
    if (posts.length > 0) {
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
    const { data: membership } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id)
      .eq("community_id", community.id)
      .maybeSingle();
    isJoined = !!membership;
  }

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-lg overflow-hidden border border-paper-dark">
        <div className="h-20 bg-gradient-to-r from-brand/15 via-gold/15 to-brand/10 relative">
          <div className="absolute inset-0 bg-paper-grid bg-paper-grid opacity-40" />
        </div>
        <div className="bg-white p-4 flex items-center justify-between gap-4 flex-wrap relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-serif text-lg font-semibold border-4 border-white -mt-8 shadow-ink shrink-0">
              {community.slug.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold font-serif">
                c/{community.slug}
              </h1>
              <div className="text-xs text-ink-mute mt-0.5">
                {community.member_count} 成员 · {community.post_count} 帖子
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <JoinCommunityButton
              communityId={community.id}
              isLoggedIn={!!user}
              initialJoined={isJoined}
            />
            {user ? (
              <Link
                href={`/c/${community.slug}/submit`}
                className="border border-paper-dark hover:bg-paper-dark text-ink-soft text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap"
              >
                发帖
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-brand hover:underline whitespace-nowrap"
              >
                登录后发帖
              </Link>
            )}
          </div>
        </div>
        {community.description && (
          <div className="bg-white border-t border-paper-dark px-4 py-3 text-sm text-ink-soft">
            {community.description}
          </div>
        )}
      </div>

      <SortTabs current={sort} basePath={`/c/${community.slug}`} />

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="card p-6 text-sm text-ink-mute">
            c/{community.slug} 还没有帖子。
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userVote={userVotes[post.id] ?? 0}
            isLoggedIn={!!user}
            currentUserId={user?.id}
          />
        ))}
      </div>
    </div>
  );
}
