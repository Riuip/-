import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import VoteButtons from "@/components/VoteButtons";
import CommentThread from "@/components/CommentThread";
import CommentForm from "@/components/CommentForm";
import DeletePostButton from "@/components/DeletePostButton";
import ReportButton from "@/components/ReportButton";
import ModActions from "@/components/ModActions";
import Markdown from "@/components/Markdown";
import { renderMarkdown } from "@/lib/markdown";
import type { PostWithScore, CommentWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts_with_score")
    .select("title, body, community_slug, author_username")
    .eq("id", params.id)
    .maybeSingle();
  if (!post) return { title: "帖子未找到" };
  const desc =
    (post.body ?? "").slice(0, 140) || `c/${post.community_slug} 的帖子`;
  return {
    title: `${post.title}`,
    description: desc,
    openGraph: { title: post.title, description: desc, type: "article" },
  };
}

export default async function PostPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parallelize: fetch post + comments together
  const [postResult, commentsResult] = await Promise.all([
    supabase
      .from("posts_with_score")
      .select("*")
      .eq("id", params.id)
      .maybeSingle<PostWithScore>(),
    supabase
      .from("comments_with_score")
      .select("*")
      .eq("post_id", params.id)
      .order("created_at", { ascending: true }),
  ]);

  const post = postResult.data;
  if (!post) notFound();
  const comments = (commentsResult.data ?? []) as CommentWithScore[];

  // Pre-render markdown
  const renderedBodies: Record<string, string> = {};
  for (const c of comments) {
    renderedBodies[c.id] = renderMarkdown(c.body);
  }

  // Parallel: fetch user votes and mod status
  let postUserVote: -1 | 0 | 1 = 0;
  const commentUserVotes: Record<string, -1 | 1> = {};
  let isMod = false;
  if (user) {
    const promises: Promise<unknown>[] = [
      supabase
        .from("votes")
        .select("value")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .is("comment_id", null)
        .maybeSingle(),
      // Is this user a mod or creator of the post's community?
      supabase
        .from("communities")
        .select("created_by")
        .eq("id", post.community_id)
        .maybeSingle(),
      supabase
        .from("community_moderators")
        .select("user_id")
        .eq("community_id", post.community_id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ];
    if (comments.length > 0) {
      const cIds = comments.map((c) => c.id);
      promises.push(
        supabase
          .from("votes")
          .select("comment_id, value")
          .eq("user_id", user.id)
          .in("comment_id", cIds),
      );
    }
    const results = (await Promise.all(promises)) as Array<{
      data?: unknown;
    }>;

    const pvData = results[0]?.data as { value: number } | null;
    if (pvData) postUserVote = pvData.value as -1 | 1;

    const cmty = results[1]?.data as { created_by: string | null } | null;
    const modRow = results[2]?.data as { user_id: string } | null;
    isMod = (cmty?.created_by === user.id) || !!modRow;

    if (comments.length > 0) {
      const cv = results[3]?.data as Array<{
        comment_id: string;
        value: number;
      }> | null;
      for (const v of cv ?? []) {
        if (v.comment_id) commentUserVotes[v.comment_id] = v.value as -1 | 1;
      }
    }
  }

  const created = new Date(post.created_at);
  const isOwner = !!user && user.id === post.author_id;

  return (
    <div className="space-y-4">
      <article className="card flex">
        <div className="w-12 flex-shrink-0 flex items-start justify-center pt-4 border-r border-surface-border dark:border-surface-dark-border bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 rounded-l-xl">
          <VoteButtons
            postId={post.id}
            initialScore={post.score}
            initialUserVote={postUserVote}
            isLoggedIn={!!user}
          />
        </div>
        <div className="flex-1 p-4 sm:p-5 min-w-0">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5 flex-wrap">
            {post.is_pinned && (
              <span className="badge-gold flex items-center gap-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4.456.734a1.75 1.75 0 0 1 2.826.504l.613 1.327a3.081 3.081 0 0 0 2.084 1.707l1.408.422a1.75 1.75 0 0 1 .526 3.09l-1.146.86a3.076 3.076 0 0 0-1.158 2.388l-.012 1.485a1.75 1.75 0 0 1-2.89 1.296l-1.044-1.02a3.072 3.072 0 0 0-2.654-.802l-1.474.232a1.75 1.75 0 0 1-1.744-2.572l.6-1.37a3.077 3.077 0 0 0-.04-2.67L.533 5.2a1.75 1.75 0 0 1 1.643-2.59l1.476.088a3.075 3.075 0 0 0 2.384-.97Z" />
                </svg>
                置顶
              </span>
            )}
            {post.is_locked && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Z" />
                </svg>
                已锁定
              </span>
            )}
            {post.community_slug && (
              <Link
                href={`/c/${post.community_slug}`}
                className="font-semibold text-gray-700 dark:text-gray-200 hover:text-accent transition-colors"
              >
                c/{post.community_slug}
              </Link>
            )}
            <span className="text-gray-400 dark:text-gray-600">•</span>
            {post.author_username ? (
              <Link
                href={`/u/${post.author_username}`}
                className="hover:text-accent transition-colors"
              >
                {post.author_username}
              </Link>
            ) : (
              <span>已注销</span>
            )}
            <span className="text-gray-400 dark:text-gray-600">•</span>
            <time dateTime={post.created_at} title={created.toLocaleString()}>
              {formatDistanceToNow(created, { addSuffix: true, locale: zhCN })}
            </time>
            {post.updated_at && post.updated_at !== post.created_at && (
              <span className="italic">(已编辑)</span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold leading-tight text-gray-900 dark:text-white">
            {post.title}
          </h1>

          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-accent-600 dark:text-accent-400 hover:underline break-all"
            >
              {post.url}
            </a>
          )}

          {post.body && (
            <div className="mt-3">
              <Markdown source={post.body} />
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs">
            {isOwner ? (
              <>
                <Link
                  href={`/post/${post.id}/edit`}
                  className="text-gray-500 dark:text-gray-400 hover:text-accent flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Z" />
                  </svg>
                  编辑
                </Link>
                <DeletePostButton
                  postId={post.id}
                  redirectTo={
                    post.community_slug ? `/c/${post.community_slug}` : "/"
                  }
                />
              </>
            ) : (
              user && (
                <ReportButton postId={post.id} isLoggedIn={!!user} />
              )
            )}
            {/* Moderator actions for non-owners who are mods */}
            {isMod && !isOwner && post.community_slug && (
              <ModActions
                postId={post.id}
                communitySlug={post.community_slug}
                isPinned={post.is_pinned}
                isLocked={post.is_locked}
              />
            )}
          </div>
        </div>
      </article>

      <section className="card p-5">
        <h2 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-gray-400">
            <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Z" />
          </svg>
          {post.comment_count} 条评论
        </h2>

        {post.is_locked ? (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
            🔒 此帖子已被版主锁定，无法新增评论。
          </div>
        ) : user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/login" className="text-accent hover:underline">
              登录
            </Link>{" "}
            后即可评论。
          </p>
        )}

        <CommentThread
          comments={comments}
          userVotes={commentUserVotes}
          isLoggedIn={!!user}
          postId={post.id}
          currentUserId={user?.id}
          renderedBodies={renderedBodies}
        />
      </section>
    </div>
  );
}
