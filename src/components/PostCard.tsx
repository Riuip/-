import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import VoteButtons from "./VoteButtons";
import DeletePostButton from "./DeletePostButton";
import type { PostWithScore } from "@/lib/types";

type Props = {
  post: PostWithScore;
  /** Vote value of the current user on this post: -1, 0, or 1. */
  userVote?: -1 | 0 | 1;
  isLoggedIn: boolean;
  /** If provided AND equals post.author_id, show a delete button. */
  currentUserId?: string | null;
};

export default function PostCard({
  post,
  userVote = 0,
  isLoggedIn,
  currentUserId,
}: Props) {
  const created = new Date(post.created_at);
  const isOwner = !!currentUserId && currentUserId === post.author_id;
  return (
    <article className="card flex hover:border-gray-400 transition-colors">
      <div className="bg-gray-50 rounded-l-md py-2">
        <VoteButtons
          postId={post.id}
          initialScore={post.score}
          initialUserVote={userVote}
          isLoggedIn={isLoggedIn}
        />
      </div>

      <div className="flex-1 p-3 min-w-0">
        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1 flex-wrap">
          {post.community_slug && (
            <Link
              href={`/c/${post.community_slug}`}
              className="font-medium text-gray-800 hover:underline"
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
        </div>

        <Link href={`/post/${post.id}`}>
          <h2 className="text-lg font-medium leading-snug hover:underline">
            {post.title}
          </h2>
        </Link>

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
          <p className="mt-2 text-sm text-gray-700 line-clamp-3 whitespace-pre-wrap">
            {post.body}
          </p>
        )}

        <div className="mt-2 text-xs text-gray-500 flex items-center gap-3">
          <Link href={`/post/${post.id}`} className="hover:underline">
            {post.comment_count} 条评论
          </Link>
          {isOwner && <DeletePostButton postId={post.id} />}
        </div>
      </div>
    </article>
  );
}
