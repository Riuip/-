import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import SortTabs from "@/components/SortTabs";
import type { PostWithScore, FeedMode } from "@/lib/types";
import { parseSort, sortPosts } from "@/lib/sort";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { sort?: string; feed?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sort = parseSort(searchParams.sort);
  const feed: FeedMode = searchParams.feed === "joined" ? "joined" : "all";

  // If user wants "joined" feed, look up which communities they joined.
  let joinedCommunityIds: string[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    joinedCommunityIds = (memberships ?? []).map((m) => m.community_id);
  }

  // Fetch posts.
  let postsQuery = supabase
    .from("posts_with_score")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);

  if (feed === "joined" && user && joinedCommunityIds.length > 0) {
    postsQuery = postsQuery.in("community_id", joinedCommunityIds);
  }

  const { data: rawPosts, error } = await postsQuery;
  const posts = sortPosts((rawPosts ?? []) as PostWithScore[], sort);

  // Current user's votes for those posts.
  const userVotes: Record<string, -1 | 1> = {};
  if (user && posts.length > 0) {
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

  // Sidebar: top 8 communities by member_count.
  const { data: communities } = await supabase
    .from("communities_with_stats")
    .select("slug, name, member_count")
    .order("member_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(8);

  const showJoinedEmpty =
    feed === "joined" && user && joinedCommunityIds.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
      <div className="space-y-3">
        {/* Feed switch */}
        {user && (
          <div className="card px-4 py-2 flex items-center gap-2 text-sm">
            <Link
              href={
                searchParams.sort
                  ? `/?sort=${searchParams.sort}`
                  : "/"
              }
              className={`px-3 py-1 rounded-full ${
                feed === "all"
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              全部
            </Link>
            <Link
              href={
                searchParams.sort
                  ? `/?feed=joined&sort=${searchParams.sort}`
                  : "/?feed=joined"
              }
              className={`px-3 py-1 rounded-full ${
                feed === "joined"
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              已加入
            </Link>
          </div>
        )}

        <SortTabs
          current={sort}
          basePath="/"
          extraQuery={feed === "joined" ? { feed: "joined" } : undefined}
        />

        {error && (
          <div className="card p-4 text-sm text-red-600">
            加载失败: {error.message}
          </div>
        )}

        {showJoinedEmpty && (
          <div className="card p-6 text-sm text-gray-600">
            你还没加入任何社区。先去{" "}
            <Link href="/c" className="text-brand hover:underline">
              社区列表
            </Link>{" "}
            找几个感兴趣的加入吧。
          </div>
        )}

        {!showJoinedEmpty && posts.length === 0 && (
          <div className="card p-6 text-sm text-gray-600">
            暂无帖子。
            {user ? (
              <>
                {" "}
                <Link href="/c/new" className="text-brand hover:underline">
                  创建一个社区
                </Link>{" "}
                来发布第一个帖子吧!
              </>
            ) : (
              <>
                {" "}
                <Link href="/login" className="text-brand hover:underline">
                  登录
                </Link>{" "}
                后即可发帖。
              </>
            )}
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

      <aside className="space-y-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">热门社区</h2>
            <Link href="/c" className="text-xs text-gray-500 hover:underline">
              全部
            </Link>
          </div>
          {communities && communities.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {communities.map((c) => (
                <li key={c.slug} className="flex items-center justify-between">
                  <Link
                    href={`/c/${c.slug}`}
                    className="text-gray-800 hover:underline truncate"
                  >
                    c/{c.slug}
                  </Link>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                    {c.member_count} 成员
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">还没有社区。</p>
          )}
          {user && (
            <Link
              href="/c/new"
              className="mt-3 block text-center bg-brand hover:bg-brand-dark text-white text-sm font-medium px-3 py-1.5 rounded-full"
            >
              创建社区
            </Link>
          )}
        </div>

        <div className="card p-4 text-xs text-gray-500 leading-relaxed">
          这是一个 Reddit 风格的开源中文论坛 demo,基于 Next.js + Supabase 构建。
          支持 Markdown、加入社区、热门排序等功能。
        </div>
      </aside>
    </div>
  );
}
