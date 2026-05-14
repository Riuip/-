import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import SearchBar from "./SearchBar";
import Seal from "./decor/Seal";

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
    <header className="bg-white/85 backdrop-blur border-b border-paper-dark sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Seal size={32} text="论坛" />
          <span className="font-serif text-lg font-semibold tracking-wide hidden sm:inline">
            论坛
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-3 text-sm shrink-0">
          <Link href="/" className="text-ink-soft hover:text-brand">
            首页
          </Link>
          <Link href="/c" className="text-ink-soft hover:text-brand">
            社区
          </Link>
          {user && (
            <Link
              href="/c/new"
              className="text-ink-soft hover:text-brand hidden md:inline"
            >
              创建社区
            </Link>
          )}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <SearchBar />
        </div>

        {user ? (
          <div className="flex items-center gap-3 text-sm shrink-0">
            <Link
              href="/notifications"
              aria-label="通知"
              className="relative text-ink-mute hover:text-brand p-1"
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
                className="flex items-center gap-1.5 text-ink-soft hover:text-brand"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-paper-dark"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-paper-dark flex items-center justify-center text-xs font-medium text-ink-mute">
                    {username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">
                  u/<span className="font-medium">{username}</span>
                </span>
              </Link>
            )}
            <Link
              href="/settings"
              className="text-ink-mute hover:text-brand hidden sm:inline"
            >
              设置
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-1.5 rounded-full shrink-0"
          >
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
