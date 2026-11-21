"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

export default function V2CircleCarousel({ children, className = "", label }) {
  const listRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const measure = useCallback(() => {
    const list = listRef.current;
    if (list) setEdge({ start: list.scrollLeft <= 2, end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    measure();
    list.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(list);
    return () => { list.removeEventListener("scroll", measure); observer?.disconnect(); };
  }, [measure, children]);

  const scroll = (direction) => listRef.current?.scrollBy({ left: direction * Math.max(240, listRef.current.clientWidth * 0.75), behavior: "smooth" });
  const noScroll = edge.start && edge.end;

  return (
    <div className="v2-circle-carousel">
      <button type="button" className="v2-circle-carousel__arrow v2-circle-carousel__arrow--prev" aria-label={`Previous ${label}`} hidden={noScroll || edge.start} onClick={() => scroll(-1)}><FiChevronLeft aria-hidden="true" /></button>
      <ul ref={listRef} className={`v2-circles ${className}`.trim()} aria-label={label}>{children}</ul>
      <button type="button" className="v2-circle-carousel__arrow v2-circle-carousel__arrow--next" aria-label={`Next ${label}`} hidden={noScroll || edge.end} onClick={() => scroll(1)}><FiChevronRight aria-hidden="true" /></button>
    </div>
  );
}
