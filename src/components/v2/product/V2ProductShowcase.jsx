import Link from "next/link";
import V2ProductGrid from "./V2ProductGrid";
import { shopHref } from "@/lib/v2/filters";

// Home product row (New Arrivals / Best Sellers). Heading = shared .v2-sechead (eyebrow + title centred, "view all" on the right
// on desktop and under the title on mobile) so every homepage section names itself in the same place.
export default function V2ProductShowcase({ items, tag, title, eyebrow, viewAll, selectedIds, automatic = false }) {
  const visible = automatic
    ? items.slice(0, 10)
    : Array.isArray(selectedIds) && selectedIds.length
      ? selectedIds.map((id) => items.find((item) => String(item.id) === String(id))).filter(Boolean).slice(0, 10)
      : items.filter((i) => i.tags.includes(tag)).slice(0, 10);

  if (visible.length === 0) return null;

  return (
    <section className="v2-block" aria-labelledby={`v2-${tag}-title`}>
      <div className="v2-sechead v2-sechead--split v2-reveal">
        <div className="v2-sechead__title">
          {eyebrow && <p className="v2-eyebrow">{eyebrow}</p>}
          <h2 id={`v2-${tag}-title`} className="v2-display v2-h2">{title}</h2>
        </div>
        <Link href={shopHref({ tag })} className="v2-sechead__link">{viewAll}</Link>
      </div>
      <V2ProductGrid items={visible} className="v2-slider-grid" />
    </section>
  );
}
