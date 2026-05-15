"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";

type Props = {
  id: string;
  slug: string;
  initialName: string;
  initialDescription: string;
  initialIconUrl: string | null;
  initialBannerUrl: string | null;
  initialRules: string;
  initialIsPrivate: boolean;
};

export default function CommunitySettingsForm({
  id,
  slug,
  initialName,
  initialDescription,
  initialIconUrl,
  initialBannerUrl,
  initialRules,
  initialIsPrivate,
}: Props) {
  const router = useRouter();
  const iconRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [iconUrl, setIconUrl] = useState<string | null>(initialIconUrl);
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialBannerUrl);
  const [rules, setRules] = useState(initialRules);
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleIconPick(file: File) {
    setError(null);
    setUploadingIcon(true);
    const r = await uploadImage(file);
    setUploadingIcon(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setIconUrl(r.publicUrl);
  }

  async function handleBannerPick(file: File) {
    setError(null);
    setUploadingBanner(true);
    const r = await uploadImage(file);
    setUploadingBanner(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setBannerUrl(r.publicUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("communities")
      .update({
        name: name.trim() || slug,
        description: description.trim() || null,
        icon_url: iconUrl,
        banner_url: bannerUrl,
        rules: rules.trim() || null,
        is_private: isPrivate,
      })
      .eq("id", id);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("已保存");
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `确认删除社区 c/${slug}？此操作无法撤销，所有帖子和评论都会被删除。`,
      )
    )
      return;
    if (prompt(`请输入 ${slug} 以确认删除：`) !== slug) {
      alert("名称不匹配，已取消。");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("communities").delete().eq("id", id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/c");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Banner */}
      <div className="card p-5 space-y-3">
        <div>
          <label className="block text-sm font-semibold mb-2">
            社区横幅
          </label>
          <div className="rounded-xl overflow-hidden border border-surface-border dark:border-surface-dark-border bg-gray-100 dark:bg-gray-800 h-32">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-accent-100 via-accent-50 to-accent-100 dark:from-accent-900/30 dark:via-accent-800/20 dark:to-accent-900/30" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="btn-secondary text-xs disabled:opacity-50"
            >
              {uploadingBanner ? "上传中..." : "上传横幅"}
            </button>
            {bannerUrl && (
              <button
                type="button"
                onClick={() => setBannerUrl(null)}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                移除
              </button>
            )}
            <input
              ref={bannerRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleBannerPick(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            建议尺寸 1500×400，最大 5MB
          </p>
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-semibold mb-2">社区图标</label>
          <div className="flex items-center gap-3">
            {iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={iconUrl}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover ring-1 ring-surface-border dark:ring-surface-dark-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center text-2xl font-bold">
                {slug.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => iconRef.current?.click()}
                disabled={uploadingIcon}
                className="btn-secondary text-xs disabled:opacity-50"
              >
                {uploadingIcon ? "上传中..." : "上传图标"}
              </button>
              {iconUrl && (
                <button
                  type="button"
                  onClick={() => setIconUrl(null)}
                  className="text-xs text-gray-500 hover:text-red-600 self-start"
                >
                  移除
                </button>
              )}
            </div>
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
      </div>

      {/* Basic info */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          基本信息
        </h2>
        <div>
          <label className="block text-sm font-medium mb-1">
            社区显示名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            URL 标识（c/{slug}）创建后无法修改
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">简介</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="一句话介绍这个社区..."
            className="w-full bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
          />
        </div>
      </div>

      {/* Rules */}
      <div className="card p-5 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          社区规则
        </h2>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder={`例如：
1. 友善交流，禁止人身攻击
2. 禁止广告和垃圾信息
3. 内容相关性...`}
          className="w-full bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 font-mono"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          每行一条规则，建议用编号开头
        </p>
      </div>

      {/* Privacy */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          隐私
        </h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-accent focus:ring-accent"
          />
          <div className="flex-1">
            <div className="text-sm font-medium">私密社区</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              开启后，社区会显示「私密」徽标。
              （注：当前阶段不强制限制访问，主要作为标记。）
            </p>
          </div>
        </label>
      </div>

      {/* Save */}
      {error && (
        <div className="card p-3 text-sm text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50">
          {error}
        </div>
      )}
      {info && (
        <div className="card p-3 text-sm text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50">
          ✓ {info}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
        >
          删除社区
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/c/${slug}`)}
            className="btn-secondary"
          >
            返回
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "保存中..." : "保存更改"}
          </button>
        </div>
      </div>
    </form>
  );
}
