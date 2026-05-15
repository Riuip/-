import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import ModeratorManager from "./ModeratorManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "版主后台",
};

export default async function ModDashboard({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/c/${params.slug}/mod`);

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();
  if (!community) notFound();

  const isCreator = community.created_by === user.id;

  // Check moderator status
  const { data: modRow } = await supabase
    .from("community_moderators")
    .select("user_id")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isCreator && !modRow) {
    redirect(`/c/${params.slug}`);
  }

  // Recent posts in community
  const [{ data: recentPosts }, { data: mods }] = await Promise.all([
    supabase
      .from("posts_with_score")
      .select("*")
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("community_moderators")
      .select("user_id, added_at, profiles:user_id (username, avatar_url)")
      .eq("community_id", community.id),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <Link
          href={`/c/${community.slug}`}
          className="text-sm text-gray-500 hover:text-accent"
        >
          ← 返回 c/{community.slug}
        </Link>
        <h1 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
          版主后台
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          管理 c/{community.slug} 的成员和内容
        </p>
      </div>

      {/* Moderators */}
      {isCreator && (
        <div className="card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            版主管理
          </h2>
          <ModeratorManager
            communityId={community.id}
            initialMods={(mods ?? []) as ModeratorRow[]}
            creatorId={community.created_by ?? ""}
          />
        </div>
      )}

      {/* Recent posts */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          最近的帖子
        </h2>
        {!recentPosts || recentPosts.length === 0 ? (
          <p className="text-sm text-gray-500">暂无帖子。</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentPosts.map((p) => (
              <li
                key={p.id}
                className="py-2 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/post/${p.id}`}
                    className="text-sm font-medium hover:text-accent truncate block"
                  >
                    {p.is_pinned && (
                      <span className="text-accent mr-1">📌</span>
                    )}
                    {p.is_locked && (
                      <span className="text-gray-500 mr-1">🔒</span>
                    )}
                    {p.title}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {p.author_username ? `u/${p.author_username}` : "已注销"} ·{" "}
                    {formatDistanceToNow(new Date(p.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}{" "}
                    · {p.score} 分 · {p.comment_count} 评论
                  </div>
                </div>
                <Link
                  href={`/post/${p.id}`}
                  className="text-xs text-gray-500 hover:text-accent shrink-0"
                >
                  打开
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type ModeratorRow = {
  user_id: string;
  added_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};
