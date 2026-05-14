"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/upload";

export default function SettingsForm({
  initialUsername,
  initialBio,
  initialAvatarUrl,
  email,
}: {
  initialUsername: string;
  initialBio: string;
  initialAvatarUrl: string | null;
  email: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleAvatarPick(file: File) {
    setError(null);
    setUploading(true);
    const result = await uploadImage(file);
    setUploading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAvatarUrl(result.publicUrl);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      router.push("/login?next=/settings");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      setSaving(false);
      setError("用户名必须是 3-24 位小写字母、数字或下划线");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      if (error.code === "23505") setError("该用户名已被占用,请换一个");
      else setError(error.message);
      return;
    }
    setInfo("已保存");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-4">
      {/* Email (read-only) */}
      <div>
        <label className="block text-sm font-medium mb-1">邮箱</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">邮箱暂不支持修改</p>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium mb-1">头像</label>
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="头像预览"
              className="w-16 h-16 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-400">
              无
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-sm border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
            >
              {uploading ? "上传中..." : "上传新头像"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="text-xs text-gray-500 hover:text-red-600 self-start"
              >
                移除
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarPick(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium mb-1">用户名</label>
        <input
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          pattern="[a-z0-9_]{3,24}"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          3-24 位,只能包含小写字母、数字、下划线
        </p>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-1">个人简介</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="写点什么介绍自己..."
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">最多 300 字</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 rounded-full"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
