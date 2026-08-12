"use client";

import { useCallback } from "react";

export default function ThemeToggle({ className }: { className?: string }) {
  const toggle = useCallback(() => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("cancer-atlas-theme", dark ? "dark" : "light");
  }, []);

  return (
    <button
      className={className ?? "theme-btn"}
      title="Toggle theme"
      aria-label="Toggle theme"
      onClick={toggle}
    >
      ◐
    </button>
  );
}
