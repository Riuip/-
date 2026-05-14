import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "所有社区",
};

export default async function CommunityListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: communities } = await supabase
    .from("communities_with_stats")
    .select("*")
    .order("member_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  // Joined map
  let joinedSet = new Set<string>();
  if (user) {
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    joinedSet = new Set((memberships ?? []).map((m) => m.community_id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">所有社区</h1>
        {user && (
          <Link
            href="/c/new"
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-1.5 rounded-full"
          >
            创建社区
          </Link>
        )}
      </div>

      {!communities || communities.length === 0 ? (
        <div className="card p-6 text-sm text-gray-600">
          还没有社区。
          {user ? (
            <>
              {" "}
              <Link href="/c/new" className="text-brand hover:underline">
                创建第一个社区
              </Link>
              !
            </>
          ) : (
            <>
              {" "}
              <Link href="/login" className="text-brand hover:underline">
                登录
              </Link>{" "}
              后即可创建。
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {communities.map((c) => (
            <li key={c.id} className="card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/c/${c.slug}`}
                  className="font-medium hover:underline"
                >
                  c/{c.slug}
                </Link>
                <span className="text-xs text-gray-500 ml-2">
                  · {c.member_count} 成员 · {c.post_count} 帖子
                </span>
                {c.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>
              {user && joinedSet.has(c.id) && (
                <span className="text-xs text-gray-500 shrink-0">已加入</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
