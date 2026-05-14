import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import VoteButtons from "@/components/VoteButtons";
import CommentThread from "@/components/CommentThread";
import CommentForm from "@/components/CommentForm";
import type { PostWithScore, CommentWithScore } from "@/lib/types";

export const dynamic = "force-dynamic";

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

  // User vote map for the post + each comment.
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

  return (
    <div className="space-y-4">
      <article className="card flex">
        <div className="bg-gray-50 rounded-l-md py-3">
          <VoteButtons
            postId={post.id}
            initialScore={post.score}
            initialUserVote={postUserVote}
            isLoggedIn={!!user}
          />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="text-xs text-gray-500 mb-2 flex items-center gap-1 flex-wrap">
            {post.community_slug && (
              <Link
                href={`/c/${post.community_slug}`}
                className="font-medium text-gray-800 hover:underline"
              >
                c/{post.community_slug}
              </Link>
            )}
            <span>·</span>
            <span>posted by</span>
            <span className="font-medium">
              u/{post.author_username ?? "deleted"}
            </span>
            <span>·</span>
            <time dateTime={post.created_at} title={created.toLocaleString()}>
              {formatDistanceToNow(created, { addSuffix: true })}
            </time>
          </div>

          <h1 className="text-xl font-semibold leading-snug">{post.title}</h1>

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
            <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">
              {post.body}
            </p>
          )}
        </div>
      </article>

      <section className="card p-4">
        <h2 className="text-sm font-semibold mb-3">
          {post.comment_count} comment{post.comment_count === 1 ? "" : "s"}
        </h2>

        {user ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-gray-600 mb-4">
            <Link href="/login" className="text-brand hover:underline">
              Sign in
            </Link>{" "}
            to leave a comment.
          </p>
        )}

        <CommentThread
          comments={comments}
          userVotes={commentUserVotes}
          isLoggedIn={!!user}
          postId={post.id}
        />
      </section>
    </div>
  );
}
