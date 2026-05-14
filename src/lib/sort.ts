// Server-side sorting helpers used by feed and community pages.
import type { PostWithScore, SortMode } from "./types";
import { hotScore } from "./markdown";

export function parseSort(input: string | string[] | undefined): SortMode {
  const v = Array.isArray(input) ? input[0] : input;
  if (v === "hot" || v === "top") return v;
  return "new";
}

export function sortPosts(posts: PostWithScore[], mode: SortMode): PostWithScore[] {
  const arr = [...posts];
  if (mode === "top") {
    arr.sort((a, b) => b.score - a.score || compareDates(b, a));
  } else if (mode === "hot") {
    arr.sort(
      (a, b) =>
        hotScore(b.score, b.created_at) - hotScore(a.score, a.created_at),
    );
  } else {
    arr.sort((a, b) => compareDates(b, a));
  }
  return arr;
}

function compareDates(a: PostWithScore, b: PostWithScore): number {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}
