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

  const { data: post } = await supabase
    .from("posts_with_score")
    .select("*")
    .eq("id", params.id)
    .maybeSingle<PostWithScore>();
  if (!post) notFound();

  const { data: rawComments } = await supabase
    .from("comments_with_score")
    .select("*")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true });
  const comments = (rawComments ?? []) as CommentWithScore[];

  const renderedBodies: Record<string, string> = {};
  for (const c of comments) {
    renderedBodies[c.id] = renderMarkdown(c.body);
  }

  let postUserVote: -1 | 0 | 1 = 0;
  const commentUserVotes: Record<string, -1 | 1> = {};
  if (user) {
    const { data: pv } = await supabase
      .from("votes")
      .select("value")
      .eq("user_id", user.id)
      .eq("post_id", post.id)
      .is("comment_id", null)
      .maybeSingle();
    if (pv) postUserVote = pv.value as -1 | 1;

    if (comments.length > 0) {
      const cIds = comments.map((c) => c.id);
      const { data: cv } = await supabase
        .from("votes")
        .select("comment_id, value")
        .eq("user_id", user.id)
        .in("comment_id", cIds);
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
        <div className="bg-paper-dark/40 rounded-l-lg py-3">
          <VoteButtons
            postId={post.id}
            initialScore={post.score}
            initialUserVote={postUserVote}
            isLoggedIn={!!user}
          />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="text-xs text-ink-mute mb-2 flex items-center gap-1 flex-wrap">
            {post.community_slug && (
              <Link
                href={`/c/${post.community_slug}`}
                className="font-medium text-ink-soft hover:underline"
              >
                c/{post.community_slug}
              </Link>
            )}
            <span>·</span>
            <span>由</span>
            {post.author_username ? (
              <Link
                href={`/u/${post.author_username}`}
                className="font-medium hover:underline"
              >
                u/{post.author_username}
              </Link>
            ) : (
              <span className="font-medium">u/已注销</span>
            )}
            <span>·</span>
            <time dateTime={post.created_at} title={created.toLocaleString()}>
              {formatDistanceToNow(created, { addSuffix: true, locale: zhCN })}
            </time>
            {post.updated_at && post.updated_at !== post.created_at && (
              <span className="italic">(已编辑)</span>
            )}
          </div>

          <h1 className="text-xl font-semibold leading-snug font-serif">
            {post.title}
          </h1>

          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand hover:underline break-all"
            >
              {post.url}
            </a>
          )}

          {post.body && (
            <div className="mt-3">
              <Markdown source={post.body} />
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs">
            {isOwner ? (
              <>
                <Link
                  href={`/post/${post.id}/edit`}
                  className="text-ink-mute hover:text-ink"
                >
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
          </div>
        </div>
      </article>

      <section className="card p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="seal">论</span>
          {post.comment_count} 条评论
        </h2>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-ink-mute mb-4">
            <Link href="/login" className="text-brand hover:underline">
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
