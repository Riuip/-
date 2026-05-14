import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import MarkAllReadButton from "./MarkAllReadButton";
import type { NotificationView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "通知 · 论坛",
};

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const { data: rows } = await supabase
    .from("notifications_view")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  const items = (rows ?? []) as NotificationView[];
  const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">通知</h1>
        {unreadIds.length > 0 && <MarkAllReadButton ids={unreadIds} />}
      </div>

      {items.length === 0 ? (
        <div className="card p-6 text-sm text-gray-500">还没有通知。</div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationItem({ n }: { n: NotificationView }) {
  const unread = !n.read_at;
  const created = new Date(n.created_at);
  const actor = n.actor_username ?? "已注销用户";
  const verb =
    n.kind === "reply_post" ? "回复了你的帖子" : "回复了你的评论";
  const href = n.post_id ? `/post/${n.post_id}` : "/";

  // Snippet of comment body (strip markdown a bit, limit length)
  const snippet = (n.comment_body ?? "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "[图片]")
    .replace(/[*_`#>]/g, "")
    .trim()
    .slice(0, 120);

  return (
    <li
      className={`card p-3 ${
        unread ? "border-l-4 border-l-brand" : ""
      }`}
    >
      <Link href={href} className="block">
        <div className="text-xs text-gray-500 mb-1">
          <span className="font-medium text-gray-700">u/{actor}</span> {verb}
          {n.post_title && (
            <>
              {" "}
              《<span className="text-gray-700">{n.post_title}</span>》
            </>
          )}
          {" · "}
          <time dateTime={n.created_at} title={created.toLocaleString()}>
            {formatDistanceToNow(created, { addSuffix: true, locale: zhCN })}
          </time>
        </div>
        {snippet && (
          <p className="text-sm text-gray-800 line-clamp-2">{snippet}</p>
        )}
      </Link>
    </li>
  );
}
