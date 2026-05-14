import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    username = profile?.username ?? null;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-4">
        <Link
          href="/"
          className="text-brand font-bold text-lg tracking-tight"
        >
          forum
        </Link>

        <nav className="flex-1 flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </nav>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-700">
              u/<span className="font-medium">{username ?? "user"}</span>
            </span>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-3 py-1.5 rounded-full"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}
