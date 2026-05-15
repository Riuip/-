"use client";

// Lightweight @mention autocomplete overlay.
// Watches textarea value for `@<partial>` at cursor position and shows matching users.
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Suggestion = {
  username: string;
  avatar_url: string | null;
};

type Props = {
  /** Current textarea value. */
  text: string;
  /** Cursor position (selectionStart). */
  cursorPos: number;
  /** Called when user picks a suggestion. Receives the full username to insert. */
  onSelect: (username: string) => void;
  /** Called to dismiss. */
  onDismiss: () => void;
};

export default function MentionSuggestions({
  text,
  cursorPos,
  onSelect,
  onDismiss,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [query, setQuery] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract the @query from current cursor position
  useEffect(() => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@([a-z0-9_]{0,24})$/);
    if (match) {
      setQuery(match[1]);
      setActiveIdx(0);
    } else {
      setQuery(null);
      setSuggestions([]);
    }
  }, [text, cursorPos]);

  // Fetch matching users
  useEffect(() => {
    if (query === null || query.length < 1) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .ilike("username", `${query}%`)
        .limit(6);
      setSuggestions((data ?? []) as Suggestion[]);
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (query === null || suggestions.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-1 w-64 card p-1 shadow-luxury-lg z-50 animate-fade-up">
      <div className="text-[10px] text-gray-500 dark:text-gray-400 px-2 py-1">
        提及用户
      </div>
      {suggestions.map((s, i) => (
        <button
          key={s.username}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // Don't blur the textarea
            onSelect(s.username);
          }}
          onMouseEnter={() => setActiveIdx(i)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
            i === activeIdx
              ? "bg-accent-100 dark:bg-accent-900/30"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {s.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-medium">
              {s.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-medium text-gray-800 dark:text-gray-200">
            @{s.username}
          </span>
        </button>
      ))}
    </div>
  );
}
