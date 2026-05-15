"use client";

import { useState } from "react";

export default function ShareCommunityButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/c/${slug}`
        : `/c/${slug}`;

    try {
      // Native share if available (mobile)
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `c/${slug}`, url });
        return;
      }
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user dismissed the share sheet, ignore */
    }
  }

  return (
    <button
      onClick={handleClick}
      className="block w-full text-center btn-secondary text-xs"
    >
      {copied ? "✓ 链接已复制" : "邀请朋友"}
    </button>
  );
}
