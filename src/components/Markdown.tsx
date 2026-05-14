// Renders sanitized Markdown HTML.
import { renderMarkdown } from "@/lib/markdown";

export default function Markdown({
  source,
  className,
}: {
  source: string | null | undefined;
  className?: string;
}) {
  const html = renderMarkdown(source);
  return (
    <div
      className={`prose-forum text-sm text-gray-800 ${className ?? ""}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
