import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import SortTabs from "@/components/SortTabs";
import JoinCommunityButton from "@/components/JoinCommunityButton";
import ShareCommunityButton from "@/components/ShareCommunityButton";
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

  // First lookup the community (we need its id for downstream parallel queries)
  const { data: community } = await supabase
    .from("communities_with_stats")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!community) notFound();

  const sort = parseSort(searchParams.sort);

  // Run all dependent queries in parallel
  const [
    { data: rawPosts },
    membershipResult,
    { data: mods },
    { data: recentMembers },
  ] = await Promise.all([
    supabase
      .from("posts_with_score")
      .select("*")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
      .limit(60),
    user
      ? supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id)
          .eq("community_id", community.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("community_moderators")
      .select("user_id, profiles:user_id (username, avatar_url)")
      .eq("community_id", community.id)
      .limit(10),
    supabase
      .from("community_members")
      .select("user_id, created_at, profiles:user_id (username, avatar_url)")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const posts = sortPosts((rawPosts ?? []) as PostWithScore[], sort);
  // Pinned posts first
  posts.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  const isJoined = !!membershipResult.data;
  const isCreator = !!user && community.created_by === user.id;
  const isMod =
    isCreator ||
    !!(mods ?? []).find((m: { user_id: string }) => m.user_id === user?.id);

  // User votes for displayed posts
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

  const created = new Date(community.created_at);

  return (
    <div className="space-y-4">
      {/* Banner + header */}
      <div className="rounded-xl overflow-hidden border border-surface-border dark:border-surface-dark-border shadow-luxury dark:shadow-luxury-dark">
        {/* Banner image or gradient */}
        {community.banner_url ? (
          <div className="h-32 sm:h-40 bg-gray-100 dark:bg-gray-800 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={community.banner_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-accent-100 via-accent-50 to-accent-100 dark:from-accent-900/30 dark:via-accent-800/20 dark:to-accent-900/30" />
        )}

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 flex items-start gap-4 flex-wrap relative">
          {/* Icon */}
          {community.icon_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={community.icon_url}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white dark:ring-gray-800 shadow-lg -mt-10 shrink-0 bg-gray-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-2xl font-bold ring-4 ring-white dark:ring-gray-800 shadow-lg -mt-10 shrink-0">
              {community.slug.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                c/{community.slug}
              </h1>
              {community.is_private && (
                <span className="badge-gold">私密</span>
              )}
              {isMod && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-700 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-2 py-0.5 rounded">
                  {isCreator ? "创建者" : "版主"}
                </span>
              )}
            </div>
            {community.name && community.name !== community.slug && (
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
                {community.name}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {community.member_count} 成员 · {community.post_count} 帖子 ·
              创建于 {formatDistanceToNow(created, { addSuffix: true, locale: zhCN })}
            </div>
            {community.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                {community.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <JoinCommunityButton
              communityId={community.id}
              isLoggedIn={!!user}
              initialJoined={isJoined}
            />
            {user ? (
              <Link
                href={`/c/${community.slug}/submit`}
                className="btn-secondary"
              >
                发帖
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-accent hover:underline whitespace-nowrap"
              >
                登录后发帖
              </Link>
            )}
            {isCreator && (
              <Link
                href={`/c/${community.slug}/settings`}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="社区设置"
                aria-label="社区设置"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Two-column: posts + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-3 min-w-0">
          <SortTabs current={sort} basePath={`/c/${community.slug}`} />

          {posts.length === 0 ? (
            <div className="card p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              c/{community.slug} 还没有帖子。
              {user && (
                <div className="mt-3">
                  <Link
                    href={`/c/${community.slug}/submit`}
                    className="btn-primary inline-block"
                  >
                    发布第一个帖子
                  </Link>
                </div>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userVote={userVotes[post.id] ?? 0}
                isLoggedIn={!!user}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-3">
          {/* About */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              关于社区
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">成员</span>
                <span className="font-medium">{community.member_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">帖子</span>
                <span className="font-medium">{community.post_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">创建于</span>
                <span className="font-medium text-xs">
                  {formatDistanceToNow(created, {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Rules */}
          {community.rules && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                社区规则
              </h3>
              <div className="prose-forum text-sm whitespace-pre-wrap">
                {community.rules.split("\n").map((line, i) => (
                  <div
                    key={i}
                    className="py-1 border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                  >
                    {line.match(/^\d+\./) ? (
                      <span className="text-accent font-semibold mr-1">
                        {line.match(/^\d+\./)?.[0]}
                      </span>
                    ) : null}
                    <span className="text-gray-700 dark:text-gray-300">
                      {line.replace(/^\d+\./, "").trim() || line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moderators */}
          {mods && mods.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                版主 ({mods.length})
              </h3>
              <ul className="space-y-2">
                {mods.map((m) => {
                  const profile = m.profiles as {
                    username: string;
                    avatar_url: string | null;
                  } | null;
                  if (!profile) return null;
                  return (
                    <li key={m.user_id}>
                      <Link
                        href={`/u/${profile.username}`}
                        className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                      >
                        {profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-[10px] font-medium">
                            {profile.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-gray-700 dark:text-gray-300">
                          {profile.username}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Recent members */}
          {recentMembers && recentMembers.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                最近加入
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {recentMembers.map((m) => {
                  const profile = m.profiles as {
                    username: string;
                    avatar_url: string | null;
                  } | null;
                  if (!profile) return null;
                  return (
                    <Link
                      key={m.user_id}
                      href={`/u/${profile.username}`}
                      title={profile.username}
                      className="block hover:scale-110 transition-transform"
                    >
                      {profile.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-[10px] font-medium">
                          {profile.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share / Mod link */}
          <div className="card p-4 space-y-2">
            <ShareCommunityButton slug={community.slug} />
            {isMod && (
              <Link
                href={`/c/${community.slug}/mod`}
                className="block w-full text-center btn-secondary text-xs"
              >
                版主后台
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
