"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  postId: string;
  communitySlug: string;
  isPinned: boolean;
  isLocked: boolean;
};

export default function ModActions({
  postId,
  communitySlug,
  isPinned,
  isLocked,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function togglePin() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("posts")
      .update({ is_pinned: !isPinned })
      .eq("id", postId);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  async function toggleLock() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("posts")
      .update({ is_locked: !isLocked })
      .eq("id", postId);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  async function deletePost() {
    if (!confirm("确认删除这个帖子？此操作不可撤销。")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", postId);
    setLoading(false);
    router.push(`/c/${communitySlug}`);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-accent transition-colors"
        disabled={loading}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM1.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        </svg>
        管理
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-6 z-50 w-40 card p-1.5 text-sm shadow-luxury-lg animate-fade-up">
            <button
              onClick={togglePin}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-accent">
                <path d="M4.456.734a1.75 1.75 0 0 1 2.826.504l.613 1.327a3.081 3.081 0 0 0 2.084 1.707l1.408.422a1.75 1.75 0 0 1 .526 3.09l-1.146.86a3.076 3.076 0 0 0-1.158 2.388l-.012 1.485a1.75 1.75 0 0 1-2.89 1.296l-1.044-1.02a3.072 3.072 0 0 0-2.654-.802l-1.474.232a1.75 1.75 0 0 1-1.744-2.572l.6-1.37a3.077 3.077 0 0 0-.04-2.67L.533 5.2a1.75 1.75 0 0 1 1.643-2.59l1.476.088a3.075 3.075 0 0 0 2.384-.97Z" />
              </svg>
              {isPinned ? "取消置顶" : "置顶"}
            </button>
            <button
              onClick={toggleLock}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-gray-500">
                <path d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z" />
              </svg>
              {isLocked ? "解锁评论" : "锁定评论"}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={deletePost}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z" />
              </svg>
              删除帖子
            </button>
          </div>
        </>
      )}
    </div>
  );
}
