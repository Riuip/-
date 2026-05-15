import Link from "next/link";
import type { SortMode } from "@/lib/types";

const TABS: { key: SortMode; label: string }[] = [
  { key: "new", label: "最新" },
  { key: "hot", label: "热门" },
  { key: "top", label: "最高" },
];

export default function SortTabs({
  current,
  basePath,
  extraQuery,
}: {
  current: SortMode;
  basePath: string;
  extraQuery?: Record<string, string>;
}) {
  return (
    <div className="card px-1 py-1 flex items-center gap-0.5 text-sm">
      {TABS.map((t) => {
        const params = new URLSearchParams({ ...(extraQuery ?? {}) });
        if (t.key !== "new") params.set("sort", t.key);
        const qs = params.toString();
        const href = qs ? `${basePath}?${qs}` : basePath;
        const active = current === t.key;
        return (
          <Link
            key={t.key}
            href={href}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              active
                ? "bg-accent text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
