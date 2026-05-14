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

  // If user wants "joined" feed, look up which communities they joined.
  let joinedCommunityIds: string[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    joinedCommunityIds = (memberships ?? []).map((m) => m.community_id);
  }

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

  // Sidebar: top contributors (by their cumulative post score).
  const { data: topContributors } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .order("created_at", { ascending: false })
    .limit(5);

  const showJoinedEmpty =
    feed === "joined" && user && joinedCommunityIds.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">
      <div className="space-y-3">
        {/* 中文标语 */}
        <div className="card p-4 bg-gradient-to-br from-brand/5 via-paper to-gold/5 border-brand/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-wide">
                以文会友 · 雅集论道
              </h1>
              <p className="text-xs text-ink-mute mt-1 font-serif tracking-wide">
                海纳百川,有容乃大
              </p>
            </div>
            <span className="seal text-xs">坛</span>
          </div>
        </div>

        {/* Feed switch */}
        {user && (
          <div className="card px-4 py-2 flex items-center gap-2 text-sm">
            <Link
              href={searchParams.sort ? `/?sort=${searchParams.sort}` : "/"}
              className={`px-3 py-1 rounded-full ${
                feed === "all"
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-paper-dark"
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
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-paper-dark"
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
          <div className="card p-4 text-sm text-red-600">
            加载失败: {error.message}
          </div>
        )}

        {showJoinedEmpty && (
          <div className="card p-6 text-sm text-ink-mute">
            你还没加入任何社区。先去{" "}
            <Link href="/c" className="text-brand hover:underline">
              社区列表
            </Link>{" "}
            找几个感兴趣的加入吧。
          </div>
        )}

        {!showJoinedEmpty && posts.length === 0 && (
          <div className="card p-6 text-sm text-ink-mute">
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
        {/* 热门社区 */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <span className="seal">坛</span>热门社区
            </h2>
            <Link href="/c" className="text-xs text-ink-mute hover:text-brand">
              全部
            </Link>
          </div>
          {communities && communities.length > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {communities.map((c, i) => (
                <li
                  key={c.slug}
                  className="flex items-center justify-between gap-2"
                >
                  <Link
                    href={`/c/${c.slug}`}
                    className="text-ink-soft hover:text-brand truncate flex items-center gap-2"
                  >
                    <span className="text-ink-mute font-mono text-xs w-4 text-right">
                      {i + 1}
                    </span>
                    c/{c.slug}
                  </Link>
                  <span className="text-xs text-ink-mute shrink-0">
                    {c.member_count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-mute">还没有社区。</p>
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

        {/* 新成员 */}
        {topContributors && topContributors.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
              <span className="seal">人</span>新成员
            </h2>
            <ul className="space-y-1.5 text-sm">
              {topContributors.map((c) => (
                <li key={c.username}>
                  <Link
                    href={`/u/${c.username}`}
                    className="flex items-center gap-2 hover:text-brand"
                  >
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover border border-paper-dark"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-paper-dark text-ink-mute flex items-center justify-center text-[10px]">
                        {c.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-ink-soft truncate">u/{c.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 关于 */}
        <div className="card p-4 text-xs text-ink-mute leading-relaxed">
          <div className="font-serif text-sm font-semibold text-ink-soft mb-2">
            关于本站
          </div>
          一个具有中华文化感的开源中文论坛。
          支持 Markdown、图片上传、实时评论、热门排序、举报、通知等。
          基于 Next.js + Supabase。
        </div>
      </aside>
    </div>
  );
}
