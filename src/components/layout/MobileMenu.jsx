"use client";

import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import NavLinks from "./NavLinks";

export default function MobileMenu({ links, openLabel, closeLabel }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu"
        aria-label={open ? closeLabel : openLabel} className="flex h-10 w-10 items-center justify-center text-3xl">
        {open ? <FiX /> : <FiMenu />}
      </button>
      <nav id="mobile-menu" hidden={!open} className="absolute inset-x-0 top-full bg-header px-6 py-5 shadow-lg">
        <NavLinks links={links} className="flex flex-col gap-3" onNavigate={() => setOpen(false)} />
      </nav>
    </div>
  );
}
