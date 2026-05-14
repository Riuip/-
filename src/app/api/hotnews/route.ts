// Server-side proxy that fetches Chinese hot-search lists from free public
// APIs and serves them to the client. We try several upstream sources in
// order so that a single dead endpoint doesn't take down the banner.
//
// Cache:  Each source result is wrapped in `next.revalidate = 300` (5 min),
//         and we additionally keep an in-memory snapshot per server instance
//         so that even if all upstreams blip, the banner still has data.
import { NextResponse } from "next/server";

export const revalidate = 300; // 5 minutes
export const runtime = "nodejs";

type RawItem = {
  title?: string;
  name?: string;
  desc?: string;
  url?: string;
  link?: string;
  mobil_url?: string;
  hot?: string | number;
  index?: number;
};

type NewsItem = {
  title: string;
  url: string;
  index?: number;
  hot?: string;
};

type Source = {
  name: string;
  url: string;
};

// Each upstream returns roughly: { success, title, data: [{ title, url, ... }] }
// vvhan.com is a popular open aggregator used by many small sites.
const SOURCES: Source[] = [
  { name: "百度热搜", url: "https://api.vvhan.com/api/hotlist/baiduRD" },
  { name: "微博热搜", url: "https://api.vvhan.com/api/hotlist/wbHot" },
  { name: "知乎热榜", url: "https://api.vvhan.com/api/hotlist/zhihuRD" },
  { name: "今日头条", url: "https://api.vvhan.com/api/hotlist/toutiao" },
];

// Last successful payload, in case every upstream fails on a refresh.
let snapshot: {
  items: NewsItem[];
  source: string;
  ts: number;
} | null = null;

function parseItems(json: unknown): NewsItem[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (let i = 0; i < data.length && out.length < 20; i++) {
    const raw = data[i] as RawItem;
    const title = String(raw.title ?? raw.name ?? "").trim();
    if (!title || seen.has(title)) continue;
    const url = String(
      raw.url ?? raw.link ?? raw.mobil_url ?? "",
    ).trim();
    seen.add(title);
    out.push({
      title,
      url: url || "#",
      index: typeof raw.index === "number" ? raw.index : i + 1,
      hot: raw.hot != null ? String(raw.hot) : undefined,
    });
  }
  return out;
}

async function fetchOne(src: Source): Promise<NewsItem[] | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000); // 5 s timeout
    const r = await fetch(src.url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ForumHotNews/1.0; +https://github.com/)",
        Accept: "application/json,text/plain,*/*",
      },
      next: { revalidate: 300 },
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const json = await r.json();
    const items = parseItems(json);
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export async function GET() {
  for (const src of SOURCES) {
    const items = await fetchOne(src);
    if (items) {
      snapshot = { items, source: src.name, ts: Date.now() };
      return NextResponse.json(
        {
          items,
          source: src.name,
          updated_at: new Date().toISOString(),
        },
        {
          headers: {
            // Edge / browser cache: 60 s fresh, then 5 min stale-while-revalidate.
            "Cache-Control":
              "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }
  }

  // All upstreams failed. Fall back to the last known snapshot if we have one.
  if (snapshot) {
    return NextResponse.json({
      items: snapshot.items,
      source: snapshot.source,
      stale: true,
      updated_at: new Date(snapshot.ts).toISOString(),
    });
  }

  return NextResponse.json(
    { items: [], source: null, error: "暂时无法获取热点" },
    { status: 200 },
  );
}
