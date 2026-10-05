"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import V2ProductGrid from "./V2ProductGrid";
import { shopHref } from "@/lib/v2/filters";

const TABS = ["sale", "new", "best"];

// Tabbed grid (Sale / New Arrivals / Best Sellers). Items arrive from lib/v2/catalog.js; tab filtering is client-side; "View all" opens the shop with the same tag.
export default function V2ProductShowcase({ items, tabLabels, tabsLabel, eyebrow, viewAll }) {
  const [tab, setTab] = useState("new");
  const refs = useRef({});
  const visible = items.filter((i) => i.tags.includes(tab)).slice(0, 10);

  const onKey = (e) => {
    const idx = TABS.indexOf(tab);
    const next = e.key === "ArrowRight" ? TABS[(idx + 1) % 3] : e.key === "ArrowLeft" ? TABS[(idx + 2) % 3] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    refs.current[next]?.focus();
  };

  return (
    <section id="shop" className="v2-wrap v2-block" aria-labelledby="v2-shop-title">
      <div className="v2-center v2-reveal">
        <p className="v2-eyebrow">{eyebrow}</p>
        <h2 id="v2-shop-title" className="sr-only">{tabsLabel}</h2>
        <div className="v2-tabs" role="tablist" aria-label={tabsLabel} onKeyDown={onKey}>
          {TABS.map((t) => (
            <button key={t} ref={(el) => (refs.current[t] = el)} type="button" role="tab" id={`v2-tab-${t}`} aria-selected={tab === t} aria-controls="v2-tabpanel"
              tabIndex={tab === t ? 0 : -1} className="v2-tab v2-display" onClick={() => setTab(t)}>{tabLabels[t]}</button>
          ))}
        </div>
      </div>
      <div id="v2-tabpanel" role="tabpanel" aria-labelledby={`v2-tab-${tab}`} key={tab} className="v2-tabpanel">
        <V2ProductGrid items={visible} className="v2-pgrid--home" />
      </div>
      <div className="v2-center"><Link href={shopHref({ tag: tab })} className="v2-pill v2-pill--outline">{viewAll}</Link></div>
    </section>
  );
}
