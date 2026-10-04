"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import { cn } from "@/lib/cn";

const TESTS = {
  all: () => true,
  men: (p) => p.gender === "men",
  women: (p) => p.gender === "women",
  sale: (p) => p.discount >= 25,
};

// Client: owns the active filter only.
export default function ProductGrid({ items, filters, labels }) {
  const [active, setActive] = useState("all");
  const visible = items.filter(TESTS[active]);

  return (
    <>
      <div role="group" aria-label={labels.filterLabel} className="-mt-6 mb-10 flex flex-wrap justify-center gap-3">
        {filters.map(({ id, label }) => (
          <button key={id} type="button" onClick={() => setActive(id)} aria-pressed={id === active}
            className={cn("rounded-full px-5 py-2 text-sm transition", id === active ? "bg-brand text-white" : "bg-card text-ink shadow hover:text-accent")}>
            {label}
          </button>
        ))}
      </div>
      {visible.length ? (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => <li key={p.id}><ProductCard product={p} labels={labels} /></li>)}
        </ul>
      ) : <p className="py-16 text-center text-muted">{labels.empty}</p>}
    </>
  );
}
