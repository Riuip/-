"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MarkdownEditor from "@/components/MarkdownEditor";

export default function EditPostForm({
  postId,
  initialTitle,
  initialBody,
  initialUrl,
}: {
  postId: string;
  initialTitle: string;
  initialBody: string;
  initialUrl: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        body: body.trim() || null,
        url: url.trim() || null,
      })
      .eq("id", postId);

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(`/post/${postId}`);
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
      <MarkdownEditor
        value={body}
        onChange={setBody}
        placeholder="正文(可选,支持 Markdown,可粘贴或上传图片)"
        rows={10}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push(`/post/${postId}`)}
          className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 rounded-full"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
