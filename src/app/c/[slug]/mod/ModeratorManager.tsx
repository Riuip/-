"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ModRow = {
  user_id: string;
  added_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

export default function ModeratorManager({
  communityId,
  initialMods,
  creatorId,
}: {
  communityId: string;
  initialMods: ModRow[];
  creatorId: string;
}) {
  const router = useRouter();
  const [mods, setMods] = useState(initialMods);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addMod(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const u = username.trim().toLowerCase();
    if (!u) return;
    setLoading(true);
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("username", u)
      .maybeSingle();

    if (!profile) {
      setError(`找不到用户 u/${u}`);
      setLoading(false);
      return;
    }
    if (profile.id === creatorId) {
      setError("创建者已自动是版主");
      setLoading(false);
      return;
    }
    if (mods.find((m) => m.user_id === profile.id)) {
      setError(`u/${u} 已经是版主了`);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("community_moderators")
      .insert({
        community_id: communityId,
        user_id: profile.id,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setMods([
      ...mods,
      {
        user_id: profile.id,
        added_at: new Date().toISOString(),
        profiles: {
          username: profile.username,
          avatar_url: profile.avatar_url,
        },
      },
    ]);
    setUsername("");
    setLoading(false);
    router.refresh();
  }

  async function removeMod(userId: string, name: string) {
    if (!confirm(`确认移除 u/${name} 的版主权限？`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("community_moderators")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", userId);
    if (error) {
      alert("移除失败：" + error.message);
      return;
    }
    setMods(mods.filter((m) => m.user_id !== userId));
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <form onSubmit={addMod} className="flex items-center gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          placeholder="输入用户名添加版主"
          className="flex-1 bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "添加中..." : "添加"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {mods.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
            还没有版主。
          </p>
        ) : (
          mods.map((m) => (
            <li
              key={m.user_id}
              className="py-2 flex items-center gap-3"
            >
              {m.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.profiles.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 flex items-center justify-center text-xs font-medium">
                  {m.profiles?.username.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  u/{m.profiles?.username ?? "（已注销）"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  自 {new Date(m.added_at).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() =>
                  removeMod(m.user_id, m.profiles?.username ?? "用户")
                }
                className="text-xs text-red-600 hover:underline"
              >
                移除
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
