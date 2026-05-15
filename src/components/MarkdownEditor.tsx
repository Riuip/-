"use client";

import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { uploadImage } from "@/lib/upload";
import MentionSuggestions from "./MentionSuggestions";

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
  const [cursorPos, setCursorPos] = useState(0);
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
      setCursorPos(cursor);
    });
  }

  // Replace the current @partial with @username + space.
  function applyMention(username: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const before = value.slice(0, cursorPos);
    const m = before.match(/@([a-z0-9_]{0,24})$/);
    if (!m) return;
    const startOfAt = cursorPos - m[0].length;
    const next =
      value.slice(0, startOfAt) + `@${username} ` + value.slice(cursorPos);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const newCursor = startOfAt + username.length + 2;
      ta.setSelectionRange(newCursor, newCursor);
      setCursorPos(newCursor);
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
    <div className="border border-surface-border dark:border-surface-dark-border rounded-lg overflow-hidden bg-white dark:bg-gray-800 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-all">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-border dark:border-surface-dark-border bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 text-xs">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              tab === "write"
                ? "bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              tab === "preview"
                ? "bg-white dark:bg-gray-700 border border-surface-border dark:border-surface-dark-border text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            预览
          </button>
        </div>

        {tab === "write" && (
          <div className="flex items-center gap-0.5">
            <ToolbarButton
              label="B"
              bold
              title="粗体"
              onClick={() => insertAtCursor("**粗体**")}
            />
            <ToolbarButton
              label="i"
              italic
              title="斜体"
              onClick={() => insertAtCursor("*斜体*")}
            />
            <ToolbarButton
              label="链接"
              title="链接"
              onClick={() => insertAtCursor("[文本](https://)")}
            />
            <ToolbarButton
              label="</>"
              title="代码"
              onClick={() => insertAtCursor("`代码`")}
            />
            <ToolbarButton
              label="块"
              title="代码块"
              onClick={() => insertAtCursor("\n```\n代码\n```\n")}
            />
            <ToolbarButton
              label="❝"
              title="引用"
              onClick={() => insertAtCursor("\n> ")}
            />
            <ToolbarButton
              label="@"
              title="提及"
              onClick={() => insertAtCursor("@")}
            />
            {enableImageUpload && (
              <>
                <span className="text-gray-300 dark:text-gray-600 mx-1">
                  |
                </span>
                <button
                  type="button"
                  disabled={uploading || disabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                  title="上传图片"
                >
                  {uploading ? "↑" : "🖼"}
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
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setCursorPos(e.target.selectionStart);
            }}
            onKeyUp={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
            onClick={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart)}
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
            className="w-full px-3 py-2.5 text-sm font-mono outline-none resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <MentionSuggestions
            text={value}
            cursorPos={cursorPos}
            onSelect={applyMention}
            onDismiss={() => {}}
          />
        </div>
      ) : (
        <div className="px-3 py-3 min-h-[8rem] bg-white dark:bg-gray-800">
          {value.trim() ? (
            <div
              className="prose-forum text-sm"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
              这里没有内容。
            </p>
          )}
        </div>
      )}

      {uploadError && (
        <p className="px-3 py-1 text-xs text-red-600 border-t border-red-100 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50">
          上传失败：{uploadError}
        </p>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  title,
  bold,
  italic,
}: {
  label: string;
  onClick: () => void;
  title?: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${
        bold ? "font-bold" : ""
      } ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}
