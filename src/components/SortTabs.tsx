import Link from "next/link";
import type { SortMode } from "@/lib/types";

const TABS: { key: SortMode; label: string; icon: string }[] = [
  { key: "new", label: "最新", icon: "新" },
  { key: "hot", label: "热门", icon: "热" },
  { key: "top", label: "最高", icon: "顶" },
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
    <div className="card px-2 py-1.5 flex items-center gap-1 text-sm">
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
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
              active
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-paper-dark"
            }`}
          >
            <span
              className={`text-[10px] font-bold ${
                active ? "" : "text-brand"
              }`}
            >
              {t.icon}
            </span>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
