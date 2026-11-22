import V2Button from "@/components/v2/ui/V2Button";
import { ROUTES } from "@/config/v2";

// Custom pages can include this section for any locale, so every string has a fallback.
export default function V2PromoBanner({ v2 }) {
  const p = v2?.promo || {};
  return (
    <section id="sale" className="v2-promo-banner" aria-labelledby="v2-promo-title">
      <div className="v2-wrap v2-promo__in v2-reveal">
        {p.eyebrow && <p className="v2-eyebrow" style={{ margin: 0 }}>{p.eyebrow}</p>}
        <h2 id="v2-promo-title" className="v2-h2">{p.title || ""}</h2>
        {p.text && <p>{p.text}</p>}
        <V2Button href={`${ROUTES?.shop || "/shop"}?tag=new`} variant="accent">{p.cta || v2?.nav?.shop || "Shop"}</V2Button>
      </div>
    </section>
  );
}
