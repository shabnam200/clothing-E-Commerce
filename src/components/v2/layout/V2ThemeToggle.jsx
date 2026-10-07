"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

const KEY = "avenor-theme";

// Light / dark switch. The <html> class is set before paint by the inline script in (v2)/layout.js;
// this button only flips it and remembers the choice in localStorage.
export default function V2ThemeToggle({ toLight, toDark }) {
  const [theme, setTheme] = useState(null); // null until mounted, so server and client markup match

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem(KEY, next); } catch {}
    setTheme(next);
  };

  const dark = theme === "dark";
  return (
    <button type="button" className="v2-icon-btn v2-theme-btn" onClick={flip} aria-label={dark ? toLight : toDark} title={dark ? toLight : toDark}>
      {theme === null ? <FiMoon aria-hidden="true" /> : dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
    </button>
  );
}
