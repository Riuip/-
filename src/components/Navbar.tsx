import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import SearchBar from "./SearchBar";
import DarkModeToggle from "./DarkModeToggle";

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
    <header className="sticky top-0 z-30 bg-gray-900 dark:bg-black border-b border-gray-800 dark:border-gray-700/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {/* Gold diamond icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-sm group-hover:shadow-accent-500/30 transition-shadow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path d="M8 1L14.5 8L8 15L1.5 8L8 1Z" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight hidden sm:inline">
            Forum
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/" className="btn-ghost text-gray-300 hover:text-white">
            首页
          </Link>
          <Link href="/c" className="btn-ghost text-gray-300 hover:text-white">
            社区
          </Link>
          {user && (
            <Link href="/c/new" className="btn-ghost text-gray-300 hover:text-white">
              创建
            </Link>
          )}
        </nav>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-auto">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <DarkModeToggle />

          {user ? (
            <>
              {/* Notifications */}
              <Link
                href="/notifications"
                aria-label="通知"
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              <Link
                href={username ? `/u/${username}` : "/settings"}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-700" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-700 ring-2 ring-gray-600 flex items-center justify-center text-xs font-medium text-gray-300">
                    {(username ?? "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-300 font-medium hidden lg:inline max-w-[100px] truncate">
                  {username ?? "用户"}
                </span>
              </Link>

              {/* Settings + Sign out */}
              <Link href="/settings" className="hidden sm:flex p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 2a.75.75 0 0 1 .75.75V3.5a4.504 4.504 0 0 1 3.25 3.25H13.25a.75.75 0 0 1 0 1.5H12a4.504 4.504 0 0 1-3.25 3.25v1.25a.75.75 0 0 1-1.5 0V11.5A4.504 4.504 0 0 1 4 8.25H2.75a.75.75 0 0 1 0-1.5H4A4.504 4.504 0 0 1 7.25 3.5V2.75A.75.75 0 0 1 8 2Zm-2.5 6a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
                </svg>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
