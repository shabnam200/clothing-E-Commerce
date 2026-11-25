"use client";

import Link from "next/link";
import { forwardRef, useEffect, useState } from "react";

// Drop-in replacement for next/link.
//
// next/link prefetches every link that scrolls into view (the "?_rsc=" requests in the Network tab). Doing that DURING page load competes
// with the HTML, CSS, JS and images, so the page takes longer to load. This wrapper changes only WHEN that happens:
//
//   "scroll" (default): nothing is prefetched until the page has finished loading. After that, links are prefetched as they scroll into
//                       view (normal Next behaviour), and a link is prefetched at once when hovered / focused / touched.
//   "hover"           : never prefetch on scroll, only on hover / focus / touch (fewest requests).
//
// Change the mode with NEXT_PUBLIC_LINK_PREFETCH=hover in the Vercel environment variables, or edit MODE below.
// Pass prefetch={true} / {false} on a single link to override the mode for that link.
const MODE = process.env.NEXT_PUBLIC_LINK_PREFETCH === "hover" ? "hover" : "scroll";

// One shared "page finished loading" flag, so 70 links do not each register their own listener.
let loaded = false;
const waiting = new Set();
const markLoaded = () => {
  if (loaded) return;
  loaded = true;
  const run = () => { waiting.forEach((fn) => fn()); waiting.clear(); };
  // Wait for the browser to be idle so prefetching never competes with first paint / hydration work.
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 500);
};
if (typeof window !== "undefined") {
  if (document.readyState === "complete") markLoaded();
  else window.addEventListener("load", markLoaded, { once: true });
}

const AppLink = forwardRef(function AppLink({ prefetch, onMouseEnter, onFocus, onTouchStart, ...props }, ref) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (MODE !== "scroll") return undefined;
    if (loaded) { const id = setTimeout(() => setActive(true), 0); return () => clearTimeout(id); }
    const wake = () => setActive(true);
    waiting.add(wake);
    return () => waiting.delete(wake);
  }, []);
  const arm = (handler) => (event) => { setActive(true); handler?.(event); };
  return (
    <Link
      ref={ref}
      {...props}
      prefetch={prefetch !== undefined ? prefetch : active ? null : false}
      onMouseEnter={arm(onMouseEnter)}
      onFocus={arm(onFocus)}
      onTouchStart={arm(onTouchStart)}
    />
  );
});

export default AppLink;
