import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser, getCurrentProfile, getUnreadNotificationCount } from "@/lib/auth";
import SignOutButton from "./SignOutButton";
import SearchBar from "./SearchBar";
import DarkModeToggle from "./DarkModeToggle";

export default async function Navbar() {
  const [user, profile, unreadCount] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  const username = profile?.username ?? null;
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-5">
        <Link href="/" prefetch className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-300 via-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20 group-hover:shadow-accent-500/40 group-hover:scale-105 transition-all">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M8 1L14.5 8L8 15L1.5 8L8 1Z" /></svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:inline">Forum</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/" prefetch className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">首页</Link>
          <Link href="/c" prefetch className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">社区</Link>
          {user && <Link href="/c/new" prefetch className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">创建</Link>}
        </nav>

        <div className="flex-1 max-w-lg mx-auto">
          <Suspense fallback={null}><SearchBar /></Suspense>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <DarkModeToggle />
          {user ? (
            <>
              <Link href="/notifications" prefetch aria-label="通知" className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </Link>
              <Link href={username ? `/u/${username}` : "/settings"} prefetch className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-accent-500/30" /> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 ring-2 ring-accent-500/30 flex items-center justify-center text-xs font-bold text-white">{(username ?? "U").charAt(0).toUpperCase()}</div>}
                <span className="text-sm text-gray-300 font-medium hidden lg:inline max-w-[100px] truncate">{username ?? "用户"}</span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm whitespace-nowrap">登录</Link>
          )}
        </div>
      </div>
    </header>
  );
}
