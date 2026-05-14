"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewCommunityForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/c/new");
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    const { data, error } = await supabase
      .from("communities")
      .insert({
        slug: cleanSlug,
        name: name.trim() || cleanSlug,
        description: description.trim() || null,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (error) {
      setLoading(false);
      if (error.code === "23505") setError("该 slug 已被占用,请换一个");
      else setError(error.message);
      return;
    }

    // Auto-join the creator.
    await supabase
      .from("community_members")
      .insert({ user_id: user.id, community_id: data.id });

    router.push(`/c/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">
          社区 ID(slug)
        </label>
        <input
          type="text"
          placeholder="例如:tech、gaming、shanghai"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          pattern="[a-z0-9_]{3,24}"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          3-24 位,只能包含小写字母、数字、下划线。社区地址将是 c/{slug || "..."}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">社区名称</label>
        <input
          type="text"
          placeholder="可选,留空将使用 slug"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">社区简介</label>
        <textarea
          placeholder="可选,介绍一下你的社区"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !slug.trim()}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 rounded-full"
        >
          {loading ? "创建中..." : "创建"}
        </button>
      </div>
    </form>
  );
}
