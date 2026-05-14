"use client";

import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { uploadImage } from "@/lib/upload";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  /** Whether to show the image upload button. Default: true. */
  enableImageUpload?: boolean;
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "支持 Markdown 语法...",
  rows = 8,
  disabled,
  enableImageUpload = true,
}: Props) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + text.length;
      ta.setSelectionRange(cursor, cursor);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      const result = await uploadImage(file);
      if (result.ok) {
        insertAtCursor(`\n![image](${result.publicUrl})\n`);
      } else {
        setUploadError(result.error);
        break;
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="border border-paper-dark rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-paper-dark bg-paper-dark/30 px-2 py-1 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-2 py-1 rounded ${
              tab === "write"
                ? "bg-white border border-paper-dark text-ink"
                : "text-ink-mute hover:bg-white/60"
            }`}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-2 py-1 rounded ${
              tab === "preview"
                ? "bg-white border border-paper-dark text-ink"
                : "text-ink-mute hover:bg-white/60"
            }`}
          >
            预览
          </button>
        </div>

        {tab === "write" && (
          <div className="flex items-center gap-1">
            <ToolbarButton
              label="粗体"
              onClick={() => insertAtCursor("**粗体**")}
            />
            <ToolbarButton
              label="斜体"
              onClick={() => insertAtCursor("*斜体*")}
            />
            <ToolbarButton
              label="链接"
              onClick={() => insertAtCursor("[链接文本](https://)")}
            />
            <ToolbarButton
              label="代码"
              onClick={() => insertAtCursor("`代码`")}
            />
            <ToolbarButton
              label="块"
              onClick={() => insertAtCursor("\n```\n代码块\n```\n")}
            />
            <ToolbarButton
              label="引用"
              onClick={() => insertAtCursor("\n> 引用\n")}
            />
            {enableImageUpload && (
              <>
                <span className="text-paper-dark mx-1">|</span>
                <button
                  type="button"
                  disabled={uploading || disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded text-ink-soft hover:bg-white/60 disabled:opacity-50"
                >
                  {uploading ? "上传中..." : "图片"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          onPaste={(e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
              if (item.kind === "file" && item.type.startsWith("image/")) {
                e.preventDefault();
                const f = item.getAsFile();
                if (f) {
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  handleFiles(dt.files);
                }
                break;
              }
            }
          }}
          className="w-full px-3 py-2 text-sm font-mono outline-none resize-y bg-white"
        />
      ) : (
        <div className="px-3 py-2 min-h-[8rem]">
          {value.trim() ? (
            <div
              className="prose-forum text-sm text-ink"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <p className="text-sm text-ink-mute italic">这里没有内容。</p>
          )}
        </div>
      )}

      {uploadError && (
        <p className="px-3 py-1 text-xs text-red-600 border-t border-red-100 bg-red-50">
          上传失败:{uploadError}
        </p>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 rounded text-ink-soft hover:bg-white/60"
    >
      {label}
    </button>
  );
}
