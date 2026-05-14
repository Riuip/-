"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="card p-8 max-w-md mx-auto text-center">
      <div className="text-5xl font-bold text-brand mb-2">出错了</div>
      <p className="text-sm text-gray-600 mb-4">
        加载页面时出了点问题。可以刷新试试,或者回首页。
      </p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => reset()}
          className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-1.5 rounded-full"
        >
          重试
        </button>
        <Link
          href="/"
          className="border border-gray-300 hover:bg-gray-100 text-gray-800 text-sm font-medium px-4 py-1.5 rounded-full"
        >
          回首页
        </Link>
      </div>
    </div>
  );
}
