import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import VoteButtons from "./VoteButtons";
import DeletePostButton from "./DeletePostButton";
import ReportButton from "./ReportButton";
import type { PostWithScore } from "@/lib/types";

type Props = {
  post: PostWithScore;
  userVote?: -1 | 0 | 1;
  isLoggedIn: boolean;
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
    <article className="card hover-lift group">
      <div className="flex">
        {/* Vote column */}
        <div className="w-12 flex-shrink-0 flex items-start justify-center pt-4 border-r border-surface-border dark:border-surface-dark-border bg-surface-secondary/50 dark:bg-surface-dark-secondary/50 rounded-l-xl">
          <VoteButtons
            postId={post.id}
            initialScore={post.score}
            initialUserVote={userVote}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Meta line */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5 flex-wrap">
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
          </div>

          {/* Title */}
          <Link href={`/post/${post.id}`}>
            <h2 className="text-base font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-accent transition-colors">
              {post.title}
            </h2>
          </Link>

          {/* URL */}
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-1 text-xs text-accent-600 dark:text-accent-400 hover:underline truncate max-w-full"
            >
              {post.url}
            </a>
          )}

          {/* Body preview */}
          {post.body && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {post.body}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
              </svg>
              {post.comment_count} 条评论
            </Link>
            {isOwner ? (
              <DeletePostButton postId={post.id} />
            ) : (
              isLoggedIn && (
                <ReportButton postId={post.id} isLoggedIn={isLoggedIn} className="text-xs" />
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
