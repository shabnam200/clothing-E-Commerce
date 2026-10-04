"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";

const subscribe = () => () => {};

// Floating yellow pill, same as the zip's DarkModeToggleBtn.
export default function ThemeToggle({ lightLabel, darkLabel }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { resolvedTheme, setTheme } = useTheme();
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";

  return (
    <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")}
      className="fixed bottom-28 right-8 z-40 flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-sm text-black shadow-lg transition hover:scale-105 dark:bg-night dark:text-white">
      {isDark ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
      {isDark ? lightLabel : darkLabel}
    </button>
  );
}
