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
  /** Extra query keys to preserve, e.g. { feed: "joined" }. */
  extraQuery?: Record<string, string>;
}) {
  return (
    <div className="card px-4 py-2 flex items-center gap-1 text-sm">
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
            className={`px-3 py-1 rounded-full ${
              active
                ? "bg-brand text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
