"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import VoteButtons from "./VoteButtons";
import CommentForm from "./CommentForm";
import type { CommentWithScore } from "@/lib/types";

type Props = {
  comments: CommentWithScore[];
  userVotes: Record<string, -1 | 1>;
  isLoggedIn: boolean;
  postId: string;
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
}: Props) {
  const tree = useMemo(() => buildTree(comments), [comments]);

  if (comments.length === 0) {
    return <p className="text-sm text-gray-500">No comments yet.</p>;
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
}: {
  node: Node;
  userVotes: Record<string, -1 | 1>;
  isLoggedIn: boolean;
  postId: string;
}) {
  const [replying, setReplying] = useState(false);
  const created = new Date(node.created_at);

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
            <span className="font-medium text-gray-700">
              u/{node.author_username ?? "deleted"}
            </span>{" "}
            ·{" "}
            <time dateTime={node.created_at} title={created.toLocaleString()}>
              {formatDistanceToNow(created, { addSuffix: true })}
            </time>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {node.body}
          </p>

          {isLoggedIn && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="text-xs text-gray-500 hover:text-gray-800 mt-1"
            >
              {replying ? "Cancel" : "Reply"}
            </button>
          )}

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
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
