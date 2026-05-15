"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";

export default function NewCommunityForm() {
  const router = useRouter();
  const iconRef = useRef<HTMLInputElement>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [rules, setRules] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleIconPick(file: File) {
    setError(null);
    setUploading(true);
    const r = await uploadImage(file);
    setUploading(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setIconUrl(r.publicUrl);
  }

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
        icon_url: iconUrl,
        rules: rules.trim() || null,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (error) {
      setLoading(false);
      if (error.code === "23505") setError("该 slug 已被占用，请换一个");
      else setError(error.message);
      return;
    }

    // Auto-join the creator
    await supabase
      .from("community_members")
      .insert({ user_id: user.id, community_id: data.id });

    router.push(`/c/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">
            社区 ID（slug）<span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="bg-gray-100 dark:bg-gray-700 border border-r-0 border-surface-border dark:border-surface-dark-border rounded-l-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
              c/
            </span>
            <input
              type="text"
              placeholder="例如：tech、gaming、shanghai"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              pattern="[a-z0-9_]{3,24}"
              required
              className="flex-1 bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-r-lg px-3 py-2 text-sm font-mono outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            3-24 位，只能包含小写字母、数字、下划线。创建后无法修改。
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            社区名称
          </label>
          <input
            type="text"
            placeholder="可选，留空将使用 slug"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">简介</label>
          <textarea
            placeholder="一句话介绍你的社区"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">图标</label>
          <div className="flex items-center gap-3">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={iconUrl}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover ring-1 ring-surface-border dark:ring-surface-dark-border"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-xl font-bold">
                {(slug || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => iconRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {uploading ? "上传中..." : iconUrl ? "更换" : "上传图标"}
            </button>
            {iconUrl && (
              <button
                type="button"
                onClick={() => setIconUrl(null)}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                移除
              </button>
            )}
            <input
              ref={iconRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleIconPick(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            社区规则 <span className="text-gray-400 font-normal">(可选)</span>
          </label>
          <textarea
            placeholder={`例如：\n1. 友善交流\n2. 禁止广告`}
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={5}
            maxLength={2000}
            className="w-full bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            创建后还可在社区设置中修改
          </p>
        </div>
      </div>

      {error && (
        <div className="card p-3 text-sm text-red-600 dark:text-red-400 border-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !slug.trim()}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建社区"}
        </button>
      </div>
    </form>
  );
}
