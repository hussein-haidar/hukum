"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {theme === "dark" ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.21-5.95H17a1 1 0 110-2h-1a1 1 0 110 2zm0 6a1 1 0 100-2h-1a1 1 0 100 2H17zM4 10a1 1 0 01-1-1V8a1 1 0 112 0v1a1 1 0 01-1 1zm-1 4a1 1 0 01-1-1v-.5a1 1 0 112 0V13a1 1 0 01-1 1zm5.95 2.464v1a1 1 0 102 0v-1a1 1 0 10-2 0zm6 0a1 1 0 102 0v-1a1 1 0 10-2 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}