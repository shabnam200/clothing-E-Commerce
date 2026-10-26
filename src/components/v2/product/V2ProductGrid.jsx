"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import V2ProductCard from "./V2ProductCard";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Home sections = horizontal slider (card size / gap / count per row come from .v2-slider in styles/v2-fixes.css).
// wrap = true -> normal wrapping grid (Shop, Sale, Wishlist).
export default function V2ProductGrid({ items, className = "", wrap = false }) {
  const scrollRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true }); // true = nothing more to scroll that way

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => { el.removeEventListener("scroll", measure); ro?.disconnect(); };
  }, [measure, items]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.offsetWidth + 20 : 300;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  if (wrap) {
    return (
      <ul className={`v2-pgrid v2-pgrid--wrap ${className}`.trim()}>
        {items.map((p) => (
          <li key={p.id}>
            <V2ProductCard p={p} />
          </li>
        ))}
      </ul>
    );
  }

  const noScroll = edge.start && edge.end; // everything already fits -> no arrows

  return (
    <div className="v2-slider-wrap">
      <button type="button" className="v2-slider__arrow v2-slider__arrow--prev" aria-label="Previous"
        hidden={noScroll || edge.start} onClick={() => scroll("left")}>
        <FiChevronLeft size={22} aria-hidden="true" />
      </button>

      <ul ref={scrollRef} className={`v2-slider ${className}`.trim()}>
        {items.map((p) => (
          <li key={p.id}>
            <V2ProductCard p={p} />
          </li>
        ))}
      </ul>

      <button type="button" className="v2-slider__arrow v2-slider__arrow--next" aria-label="Next"
        hidden={noScroll || edge.end} onClick={() => scroll("right")}>
        <FiChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
