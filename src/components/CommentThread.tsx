"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import VoteButtons from "./VoteButtons";
import CommentForm from "./CommentForm";
import DeleteCommentButton from "./DeleteCommentButton";
import type { CommentWithScore } from "@/lib/types";

type Props = {
  comments: CommentWithScore[];
  userVotes: Record<string, -1 | 1>;
  isLoggedIn: boolean;
  postId: string;
  currentUserId?: string | null;
  /** Pre-rendered HTML for each comment body (server-side sanitized markdown). */
  renderedBodies: Record<string, string>;
};

type Node = CommentWithScore & { children: Node[] };

function buildTree(rows: CommentWithScore[]): Node[] {
  const map = new Map<string, Node>();
  rows.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots: Node[] = [];
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export default function CommentThread({
  comments,
  userVotes,
  isLoggedIn,
  postId,
  currentUserId,
  renderedBodies,
}: Props) {
  const tree = useMemo(() => buildTree(comments), [comments]);

  if (comments.length === 0) {
    return <p className="text-sm text-gray-500">还没有人评论。</p>;
  }

  return (
    <ul className="space-y-3">
      {tree.map((node) => (
        <CommentNode
          key={node.id}
          node={node}
          userVotes={userVotes}
          isLoggedIn={isLoggedIn}
          postId={postId}
          currentUserId={currentUserId}
          renderedBodies={renderedBodies}
        />
      ))}
    </ul>
  );
}

function CommentNode({
  node,
  userVotes,
  isLoggedIn,
  postId,
  currentUserId,
  renderedBodies,
}: {
  node: Node;
  userVotes: Record<string, -1 | 1>;
  isLoggedIn: boolean;
  postId: string;
  currentUserId?: string | null;
  renderedBodies: Record<string, string>;
}) {
  const [replying, setReplying] = useState(false);
  const created = new Date(node.created_at);
  const isOwner = !!currentUserId && currentUserId === node.author_id;
  const html = renderedBodies[node.id] ?? "";

  return (
    <li className="border-l-2 border-gray-200 pl-3">
      <div className="flex gap-2">
        <VoteButtons
          commentId={node.id}
          initialScore={node.score}
          initialUserVote={userVotes[node.id] ?? 0}
          isLoggedIn={isLoggedIn}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1">
            {node.author_username ? (
              <Link
                href={`/u/${node.author_username}`}
                className="font-medium text-gray-700 hover:underline"
              >
                u/{node.author_username}
              </Link>
            ) : (
              <span className="font-medium text-gray-700">u/已注销</span>
            )}
            {" · "}
            <time dateTime={node.created_at} title={created.toLocaleString()}>
              {formatDistanceToNow(created, { addSuffix: true, locale: zhCN })}
            </time>
          </div>

          <div
            className="prose-forum text-sm text-gray-800"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            {isLoggedIn && (
              <button
                onClick={() => setReplying((v) => !v)}
                className="hover:text-gray-800"
              >
                {replying ? "取消" : "回复"}
              </button>
            )}
            {isOwner && <DeleteCommentButton commentId={node.id} />}
          </div>

          {replying && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={node.id}
                autoFocus
                onDone={() => setReplying(false)}
              />
            </div>
          )}

          {node.children.length > 0 && (
            <ul className="mt-3 space-y-3">
              {node.children.map((child) => (
                <CommentNode
                  key={child.id}
                  node={child}
                  userVotes={userVotes}
                  isLoggedIn={isLoggedIn}
                  postId={postId}
                  currentUserId={currentUserId}
                  renderedBodies={renderedBodies}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
