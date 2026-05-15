import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import SortTabs from "@/components/SortTabs";
import RealtimePostsBadge from "@/components/RealtimePostsBadge";
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

  // Run independent queries in parallel for fast first render.
  // Sidebar communities + recent profiles don't depend on user state.
  const sidebarPromise = Promise.all([
    supabase
      .from("communities_with_stats")
      .select("slug, name, member_count")
      .order("member_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Memberships only needed if logged in.
  const membershipsPromise = user
    ? supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id)
    : Promise.resolve({ data: [] });

  const [
    [{ data: communities }, { data: topContributors }],
    { data: memberships },
  ] = await Promise.all([sidebarPromise, membershipsPromise]);

  const joinedCommunityIds = (memberships ?? []).map(
    (m: { community_id: string }) => m.community_id,
  );

  // Build posts query (depends on memberships when feed=joined).
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

  // Pinned posts float to top (only when not filtered to joined-only feed empty case)
  posts.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  // User votes for those posts (only fetched if logged in).
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

  const showJoinedEmpty =
    feed === "joined" && user && joinedCommunityIds.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">
      <div className="space-y-3">
        {/* Hero */}
        <div className="card p-5 bg-gradient-to-br from-accent-50 via-white to-accent-50/50 dark:from-accent-900/20 dark:via-gray-800 dark:to-accent-900/10 border-accent-200/50 dark:border-accent-900/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Welcome to Forum
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                A premium community for thoughtful conversations.
              </p>
            </div>
            <div className="hidden sm:flex w-10 h-10 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="white">
                <path d="M8 1L14.5 8L8 15L1.5 8L8 1Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Feed switch */}
        {user && (
          <div className="card p-1 flex items-center gap-1 text-sm">
            <Link
              prefetch
              href={searchParams.sort ? `/?sort=${searchParams.sort}` : "/"}
              className={`flex-1 text-center px-3 py-1.5 rounded-lg font-medium transition-all ${
                feed === "all"
                  ? "bg-gray-900 dark:bg-gray-700 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              全部
            </Link>
            <Link
              prefetch
              href={
                searchParams.sort
                  ? `/?feed=joined&sort=${searchParams.sort}`
                  : "/?feed=joined"
              }
              className={`flex-1 text-center px-3 py-1.5 rounded-lg font-medium transition-all ${
                feed === "joined"
                  ? "bg-gray-900 dark:bg-gray-700 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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

        {/* Realtime new-post toast */}
        <div className="flex justify-center">
          <RealtimePostsBadge
            scopedCommunityIds={
              feed === "joined" ? joinedCommunityIds : undefined
            }
          />
        </div>

        {error && (
          <div className="card p-4 text-sm text-red-600 dark:text-red-400">
            加载失败: {error.message}
          </div>
        )}

        {showJoinedEmpty && (
          <div className="card p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            你还没加入任何社区。先去{" "}
            <Link href="/c" className="text-accent hover:underline">
              社区列表
            </Link>{" "}
            找几个感兴趣的加入吧。
          </div>
        )}

        {!showJoinedEmpty && posts.length === 0 && (
          <div className="card p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            暂无帖子。
            {user ? (
              <>
                {" "}
                <Link href="/c/new" className="text-accent hover:underline">
                  创建一个社区
                </Link>{" "}
                来发布第一个帖子吧!
              </>
            ) : (
              <>
                {" "}
                <Link href="/login" className="text-accent hover:underline">
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

      <aside className="space-y-3 hidden md:block">
        {/* Top communities */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-white">
              热门社区
            </h2>
            <Link
              href="/c"
              className="text-xs text-gray-500 hover:text-accent dark:text-gray-400"
            >
              全部 →
            </Link>
          </div>
          {communities && communities.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {communities.map((c, i) => (
                <li
                  key={c.slug}
                  className="flex items-center justify-between gap-2"
                >
                  <Link
                    prefetch
                    href={`/c/${c.slug}`}
                    className="flex items-center gap-2 min-w-0 hover:text-accent transition-colors"
                  >
                    <span className="text-gray-400 dark:text-gray-500 font-mono text-xs w-4 text-right">
                      {i + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      c/{c.slug}
                    </span>
                  </Link>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {c.member_count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              还没有社区。
            </p>
          )}
          {user && (
            <Link
              href="/c/new"
              className="mt-4 block text-center btn-primary py-2"
            >
              创建社区
            </Link>
          )}
        </div>

        {/* New members */}
        {topContributors && topContributors.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-sm mb-3 text-gray-900 dark:text-white">
              新成员
            </h2>
            <ul className="space-y-2 text-sm">
              {topContributors.map((c) => (
                <li key={c.username}>
                  <Link
                    href={`/u/${c.username}`}
                    className="flex items-center gap-2 hover:text-accent transition-colors"
                  >
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[10px] font-medium">
                        {c.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {c.username}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* About */}
        <div className="card p-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            关于
          </div>
          一个精致的开源社区论坛，支持 Markdown、图片上传、实时评论、@提及、
          版主功能。基于 Next.js + Supabase。
        </div>
      </aside>
    </div>
  );
}
