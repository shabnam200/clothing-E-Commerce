"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Adds .v2-js (enables the reveal CSS) and reveals .v2-reveal elements as they scroll into view.
export default function V2Motion() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.querySelector(".v2");
    if (!root) return;
    root.classList.add("v2-js");
    const els = root.querySelectorAll(".v2-reveal:not(.is-in)");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
