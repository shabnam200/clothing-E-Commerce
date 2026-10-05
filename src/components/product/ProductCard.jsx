"use client";

import { useState } from "react";
import RemoteImage from "@/components/ui/RemoteImage";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
import { cn } from "@/lib/cn";

// Client: per-card colour/size selection only. All text arrives pre-translated.
export default function ProductCard({ product: p, labels }) {
  const [color, setColor] = useState(p.colors[0]);
  const [size, setSize] = useState(p.sizes.find((s) => !p.soldOut.includes(s)));

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-md transition hover:shadow-xl">
      <div className="relative aspect-[4/3] bg-neutral-200">
        <RemoteImage src={p.image} alt={p.name} sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-sale px-2.5 py-1 text-xs font-bold text-white">{p.discountText}</span>
        <button type="button" aria-label={`${labels.wish}: ${p.name}`} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white hover:text-sale"><FiHeart /></button>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-sm font-bold text-brand">{p.category}</p>
        <h3 className="text-xl font-bold">{p.name}</h3>
        <p className="flex items-baseline gap-2"><span className="text-xl font-bold">{p.price}</span><span className="text-sm text-muted">{labels.mrp} <s>{p.mrp}</s></span></p>

        <fieldset>
          <legend className="mb-2 text-sm text-muted">{labels.color}: <span className="text-ink">{color.label}</span></legend>
          <div className="flex gap-2">
            {p.colors.map((c) => (
              <button key={c.hex} type="button" onClick={() => setColor(c)} aria-label={c.label} aria-pressed={c === color} style={{ backgroundColor: c.hex }}
                className={cn("h-7 w-7 rounded-full border-2", c === color ? "border-brand ring-2 ring-brand/40" : "border-black/20 dark:border-white/30")} />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm text-muted">{labels.size}</legend>
          <div className="grid grid-cols-4 gap-2">
            {p.sizes.map((s) => {
              const out = p.soldOut.includes(s);
              return (
                <button key={s} type="button" disabled={out} onClick={() => setSize(s)} aria-pressed={s === size}
                  className={cn("rounded-lg border py-1.5 text-sm transition", s === size ? "border-brand bg-brand text-white" : "border-line hover:border-brand", out && "cursor-not-allowed line-through opacity-40")}>
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="flex items-center gap-2 text-sm text-muted"><span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />{p.left}</p>
        <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-lg text-black transition hover:scale-[1.02]">
          <FiShoppingBag aria-hidden="true" /> {labels.add}
        </button>
      </div>
    </article>
  );
}
