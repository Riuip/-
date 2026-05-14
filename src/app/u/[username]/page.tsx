import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { renderMarkdown } from "@/lib/markdown";
import type { PostWithScore, CommentWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  return {
    title: `u/${params.username} · 论坛`,
    description: `用户 u/${params.username} 的主页`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .maybeSingle();
  if (!profile) notFound();

  const isSelf = !!user && user.id === profile.id;

  const { data: rawPosts } = await supabase
    .from("posts_with_score")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);
  const posts = (rawPosts ?? []) as PostWithScore[];

  const { data: rawComments } = await supabase
    .from("comments_with_score")
    .select("*")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);
  const comments = (rawComments ?? []) as CommentWithScore[];

  // Map comment_id -> post for context links.
  const commentPostIds = comments.map((c) => c.post_id);
  type ParentPost = { id: string; title: string; community_id: string };
  let commentPosts: ParentPost[] = [];
  if (commentPostIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, community_id")
      .in("id", commentPostIds);
    commentPosts = (data ?? []) as ParentPost[];
  }
  const postById = new Map<string, ParentPost>();
  for (const p of commentPosts) postById.set(p.id, p);

  // User votes on profile's posts (for display highlighting).
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

  const totalScore =
    posts.reduce((s, p) => s + p.score, 0) +
    comments.reduce((s, c) => s + c.score, 0);

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-start gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg text-gray-400 shrink-0">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">u/{profile.username}</h1>
            {isSelf && (
              <Link
                href="/settings"
                className="text-sm border border-gray-300 hover:bg-gray-100 rounded-full px-3 py-1"
              >
                编辑资料
              </Link>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            注册于{" "}
            {formatDistanceToNow(new Date(profile.created_at), {
              addSuffix: true,
              locale: zhCN,
            })}
            {" · "}总积分 {totalScore}
            {" · "}
            {posts.length} 帖子 · {comments.length} 评论
          </div>
          {profile.bio && (
            <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-2">发的帖子</h2>
        {posts.length === 0 ? (
          <div className="card p-4 text-sm text-gray-500">
            还没有发过帖子。
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                userVote={userVotes[p.id] ?? 0}
                isLoggedIn={!!user}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-2">最近的评论</h2>
        {comments.length === 0 ? (
          <div className="card p-4 text-sm text-gray-500">还没有评论。</div>
        ) : (
          <ul className="space-y-2">
            {comments.map((c) => {
              const parent = postById.get(c.post_id);
              return (
                <li key={c.id} className="card p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    在{" "}
                    {parent ? (
                      <Link
                        href={`/post/${parent.id}`}
                        className="text-gray-800 hover:underline"
                      >
                        《{parent.title}》
                      </Link>
                    ) : (
                      <span>已删除的帖子</span>
                    )}{" "}
                    评论 ·{" "}
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                    {" · "}
                    {c.score} 分
                  </div>
                  <div
                    className="prose-forum text-sm text-gray-800"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(c.body),
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
