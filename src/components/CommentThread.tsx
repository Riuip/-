"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import VoteButtons from "./VoteButtons";
import CommentForm from "./CommentForm";
import CommentEditor from "./CommentEditor";
import DeleteCommentButton from "./DeleteCommentButton";
import ReportButton from "./ReportButton";
import { createClient } from "@/lib/supabase/client";
import { renderMarkdown } from "@/lib/markdown";
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
  comments: initial,
  userVotes,
  isLoggedIn,
  postId,
  currentUserId,
  renderedBodies: initialRendered,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentWithScore[]>(initial);
  const [renderedBodies, setRenderedBodies] = useState<Record<string, string>>(
    initialRendered,
  );
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // Sync server data when navigating between posts.
  useEffect(() => {
    setComments(initial);
    setRenderedBodies(initialRendered);
    setNewIds(new Set());
  }, [initial, initialRendered]);

  // ---------- Realtime: listen for new comments on this post ----------
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:post:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            post_id: string;
            parent_id: string | null;
            author_id: string | null;
            body: string;
            created_at: string;
            updated_at: string | null;
          };
          // Skip if we already have it (we just inserted it ourselves).
          if (comments.some((c) => c.id === row.id)) return;

          // Look up author username for the new row.
          let username: string | null = null;
          let avatar: string | null = null;
          if (row.author_id) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", row.author_id)
              .maybeSingle();
            username = prof?.username ?? null;
            avatar = prof?.avatar_url ?? null;
          }

          const enriched: CommentWithScore = {
            ...row,
            author_username: username,
            author_avatar_url: avatar,
            score: 0,
          };

          setComments((prev) =>
            prev.some((c) => c.id === enriched.id) ? prev : [...prev, enriched],
          );
          setRenderedBodies((prev) => ({
            ...prev,
            [enriched.id]: renderMarkdown(enriched.body),
          }));
          setNewIds((prev) => {
            const s = new Set(prev);
            s.add(enriched.id);
            return s;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const tree = useMemo(() => buildTree(comments), [comments]);

  // After an edit finishes, re-render that comment's body locally without
  // waiting for a full router refresh.
  function applyLocalEdit(id: string, newBody: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, body: newBody, updated_at: new Date().toISOString() }
          : c,
      ),
    );
    setRenderedBodies((prev) => ({ ...prev, [id]: renderMarkdown(newBody) }));
    router.refresh();
  }

  if (comments.length === 0) {
    return <p className="text-sm text-ink-mute">还没有人评论。</p>;
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
          newIds={newIds}
          onLocalEdit={applyLocalEdit}
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
  newIds,
  onLocalEdit,
}: {
  node: Node;
  userVotes: Record<string, -1 | 1>;
  isLoggedIn: boolean;
  postId: string;
  currentUserId?: string | null;
  renderedBodies: Record<string, string>;
  newIds: Set<string>;
  onLocalEdit: (id: string, newBody: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const created = new Date(node.created_at);
  const isOwner = !!currentUserId && currentUserId === node.author_id;
  const html = renderedBodies[node.id] ?? "";
  const isFresh = newIds.has(node.id);

  return (
    <li
      className={`border-l-2 border-paper-dark pl-3 ${
        isFresh ? "flash-in" : ""
      }`}
    >
      <div className="flex gap-2">
        <VoteButtons
          commentId={node.id}
          initialScore={node.score}
          initialUserVote={userVotes[node.id] ?? 0}
          isLoggedIn={isLoggedIn}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-ink-mute mb-1">
            {node.author_username ? (
              <Link
                href={`/u/${node.author_username}`}
                className="font-medium text-ink-soft hover:underline"
              >
                u/{node.author_username}
              </Link>
            ) : (
              <span className="font-medium text-ink-soft">u/已注销</span>
            )}
            {" · "}
            <time dateTime={node.created_at} title={created.toLocaleString()}>
              {formatDistanceToNow(created, { addSuffix: true, locale: zhCN })}
            </time>
            {node.updated_at && node.updated_at !== node.created_at && (
              <span className="ml-1 italic">(已编辑)</span>
            )}
            {isFresh && (
              <span className="ml-1 text-brand font-medium">· 新</span>
            )}
          </div>

          {editing ? (
            <CommentEditor
              commentId={node.id}
              initialBody={node.body}
              onDone={(newBody) => {
                setEditing(false);
                if (newBody !== undefined) onLocalEdit(node.id, newBody);
              }}
            />
          ) : (
            <div
              className="prose-forum text-sm text-ink"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {!editing && (
            <div className="mt-1 flex items-center gap-3 text-xs text-ink-mute">
              {isLoggedIn && (
                <button
                  onClick={() => setReplying((v) => !v)}
                  className="hover:text-ink-soft"
                >
                  {replying ? "取消" : "回复"}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setEditing(true)}
                  className="hover:text-ink-soft"
                >
                  编辑
                </button>
              )}
              {isOwner && <DeleteCommentButton commentId={node.id} />}
              {!isOwner && isLoggedIn && (
                <ReportButton commentId={node.id} isLoggedIn={isLoggedIn} />
              )}
            </div>
          )}

          {replying && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={node.id}
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
                  newIds={newIds}
                  onLocalEdit={onLocalEdit}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}
