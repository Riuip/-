import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let unreadCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;

    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-4">
        <Link
          href="/"
          className="text-brand font-bold text-lg tracking-tight"
        >
          论坛
        </Link>

        <nav className="flex-1 flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            首页
          </Link>
          <Link href="/c" className="text-gray-700 hover:text-gray-900">
            社区
          </Link>
          {user && (
            <Link
              href="/c/new"
              className="text-gray-700 hover:text-gray-900"
            >
              创建社区
            </Link>
          )}
        </nav>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/notifications"
              aria-label="通知"
              className="relative text-gray-600 hover:text-gray-900 p-1"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            {username && (
              <Link
                href={`/u/${username}`}
                className="flex items-center gap-1.5 text-gray-700 hover:underline"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : null}
                <span>
                  u/<span className="font-medium">{username}</span>
                </span>
              </Link>
            )}
            <Link
              href="/settings"
              className="text-gray-600 hover:text-gray-900"
            >
              设置
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-3 py-1.5 rounded-full"
          >
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
