"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SubmitForm({
  communityId,
  communitySlug,
}: {
  communityId: string;
  communitySlug: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
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
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        community_id: communityId,
        author_id: user.id,
        title: title.trim(),
        body: body.trim() || null,
        url: url.trim() || null,
      })
      .select("id")
      .single();

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/post/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <input
        type="text"
        placeholder="标题"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
      <input
        type="url"
        placeholder="可选:链接 URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
      />
      <textarea
        placeholder="正文(可选,支持 Markdown)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
      />
      <p className="text-xs text-gray-500">
        正文支持 Markdown 语法:**粗体**、*斜体*、[链接](url)、代码块、列表等。
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push(`/c/${communitySlug}`)}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 rounded-full"
        >
          {loading ? "发布中..." : "发布"}
        </button>
      </div>
    </form>
  );
}
