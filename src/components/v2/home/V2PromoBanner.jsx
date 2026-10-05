import V2Button from "@/components/v2/ui/V2Button";

export default function V2PromoBanner({ v2 }) {
  const p = v2.promo;
  return (
    <section id="sale" className="v2-promo" aria-labelledby="v2-promo-title">
      <div className="v2-wrap v2-promo__in v2-reveal">
        <p className="v2-eyebrow" style={{ margin: 0 }}>{p.eyebrow}</p>
        <h2 id="v2-promo-title">{p.pre} <em>{p.big}</em></h2>
        <p>{p.text}</p>
        <V2Button href="/v2#new-arrivals" variant="accent">{p.cta}</V2Button>
      </div>
    </section>
  );
}
