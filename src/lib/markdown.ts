// Renders untrusted Markdown to safe HTML.
// Used by <Markdown> component in Server Components.
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({
  gfm: true,
  breaks: true, // single newline -> <br>
});

export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  // marked.parse returns string when async option is false (default for our setOptions).
  const rawHtml = marked.parse(source) as string;
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["style", "script", "iframe"],
    FORBID_ATTR: ["onerror", "onload", "onclick"],
  });
}

// Reddit-style hot score:
// log10(|score|) * sign(score) + age_in_seconds / 45000
export function hotScore(score: number, createdAt: string): number {
  const ts = new Date(createdAt).getTime() / 1000;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  return order * sign + (ts - 1_700_000_000) / 45_000;
}
