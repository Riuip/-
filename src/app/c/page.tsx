import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import JoinCommunityButton from "@/components/JoinCommunityButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "所有社区",
};

export default async function CommunityListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch in parallel
  const [{ data: communities }, membershipResult] = await Promise.all([
    supabase
      .from("communities_with_stats")
      .select("*")
      .order("member_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
    user
      ? supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const joinedSet = new Set(
    (membershipResult.data ?? []).map(
      (m: { community_id: string }) => m.community_id,
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            所有社区
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            发现并加入感兴趣的社区
          </p>
        </div>
        {user && (
          <Link href="/c/new" className="btn-primary">
            创建社区
          </Link>
        )}
      </div>

      {!communities || communities.length === 0 ? (
        <div className="card p-8 text-sm text-gray-500 dark:text-gray-400 text-center">
          还没有社区。
          {user ? (
            <>
              {" "}
              <Link href="/c/new" className="text-accent hover:underline">
                创建第一个社区
              </Link>
              !
            </>
          ) : (
            <>
              {" "}
              <Link href="/login" className="text-accent hover:underline">
                登录
              </Link>{" "}
              后即可创建。
            </>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {communities.map((c) => {
            const joined = joinedSet.has(c.id);
            return (
              <li
                key={c.id}
                className="card p-4 hover-lift flex items-start gap-3"
              >
                {/* Icon */}
                {c.icon_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.icon_url}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-surface-border dark:ring-surface-dark-border shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {c.slug.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      prefetch
                      href={`/c/${c.slug}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-accent truncate"
                    >
                      c/{c.slug}
                    </Link>
                    {user && (
                      <JoinCommunityButton
                        communityId={c.id}
                        isLoggedIn={!!user}
                        initialJoined={joined}
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {c.member_count} 成员 · {c.post_count} 帖子
                    {c.is_private && (
                      <span className="ml-2 badge-gold !text-[9px] !py-0">
                        私密
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
