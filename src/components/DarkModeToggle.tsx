"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  if (!mounted) {
    // Avoid hydration mismatch - render a placeholder
    return (
      <button className="p-2 rounded-lg text-gray-400" aria-label="切换主题">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="4" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
    >
      {dark ? (
        // Sun icon
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 1Zm0 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5.657-7.657a.75.75 0 0 1 0 1.06l-.707.708a.75.75 0 1 1-1.06-1.061l.707-.707a.75.75 0 0 1 1.06 0ZM15 8a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 15 8Zm-2.343 5.657a.75.75 0 0 1-1.06 0l-.708-.707a.75.75 0 0 1 1.061-1.06l.707.707a.75.75 0 0 1 0 1.06ZM8 13a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 13Zm-5.657-2.343a.75.75 0 0 1 0-1.06l.707-.708a.75.75 0 0 1 1.061 1.06l-.707.708a.75.75 0 0 1-1.061 0ZM3 8a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 3 8Zm.343-5.657a.75.75 0 0 1 1.06 0l.708.707A.75.75 0 0 1 4.05 4.111l-.707-.707a.75.75 0 0 1 0-1.061Z" />
        </svg>
      ) : (
        // Moon icon
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.221-7.832Z" />
        </svg>
      )}
    </button>
  );
}
