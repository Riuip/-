import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import SearchBar from "@/components/SearchBar";
import type { PostWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "搜索",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!q) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <SearchBar className="w-full" />
        <div className="card p-6 text-sm text-ink-mute">输入关键词开始搜索。</div>
      </div>
    );
  }

  // ILIKE pattern (case-insensitive). Wrap with %.
  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;

  // Posts: title or body
  const { data: postsRaw } = await supabase
    .from("posts_with_score")
    .select("*")
    .or(`title.ilike.${pattern},body.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(30);
  const posts = (postsRaw ?? []) as PostWithScore[];

  // Communities: slug, name, description
  const { data: communitiesRaw } = await supabase
    .from("communities_with_stats")
    .select("*")
    .or(
      `slug.ilike.${pattern},name.ilike.${pattern},description.ilike.${pattern}`,
    )
    .order("member_count", { ascending: false })
    .limit(10);

  // Users: username, bio
  const { data: usersRaw } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .or(`username.ilike.${pattern},bio.ilike.${pattern}`)
    .limit(10);

  // User votes on results
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

  const total =
    posts.length + (communitiesRaw?.length ?? 0) + (usersRaw?.length ?? 0);

  return (
    <div className="space-y-4">
      <SearchBar className="w-full max-w-2xl" />

      <div className="text-sm text-ink-mute">
        关键词「<span className="text-brand font-medium">{q}</span>」共找到{" "}
        {total} 条结果
      </div>

      {/* 社区 */}
      {communitiesRaw && communitiesRaw.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span className="seal">坛</span>社区
          </h2>
          <ul className="space-y-2">
            {communitiesRaw.map((c) => (
              <li
                key={c.id}
                className="card p-3 hover:border-brand transition-colors"
              >
                <Link href={`/c/${c.slug}`} className="block">
                  <div className="font-medium">c/{c.slug}</div>
                  <div className="text-xs text-ink-mute mt-0.5">
                    {c.member_count} 成员 · {c.post_count} 帖子
                  </div>
                  {c.description && (
                    <p className="text-sm text-ink-soft mt-1 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 用户 */}
      {usersRaw && usersRaw.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span className="seal">人</span>用户
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {usersRaw.map((u) => (
              <li
                key={u.username}
                className="card p-3 flex items-center gap-3 hover:border-brand transition-colors"
              >
                <Link
                  href={`/u/${u.username}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-paper-dark"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-paper-dark text-ink-mute flex items-center justify-center text-sm">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">u/{u.username}</div>
                    {u.bio && (
                      <div className="text-xs text-ink-mute line-clamp-1">
                        {u.bio}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 帖子 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <span className="seal">帖</span>帖子
        </h2>
        {posts.length === 0 ? (
          <div className="card p-6 text-sm text-ink-mute">
            没有找到匹配的帖子。
          </div>
        ) : (
          <div className="space-y-3">
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
        )}
      </section>
    </div>
  );
}
