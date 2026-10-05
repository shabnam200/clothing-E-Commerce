import V2Media from "@/components/v2/ui/V2Media";
import V2Pill from "@/components/v2/ui/V2Pill";
import { BANNERS } from "@/data/banners";
import { ROUTES } from "@/config/v2";

export default function V2Promo({ v2 }) {
  const p = v2.promo;
  return (
    <section className="v2-wrap v2-block" aria-labelledby="v2-promo-title">
      <div className="v2-promo v2-reveal">
        <V2Media src={BANNERS.v2Promo} alt={p.alt} sizes="(min-width: 900px) 55vw, 100vw" className="v2-promo__img" />
        <div className="v2-promo__text">
          <p className="v2-eyebrow">{p.eyebrow}</p>
          <h2 id="v2-promo-title" className="v2-display v2-h2">{p.title}</h2>
          <p className="v2-lede">{p.text}</p>
          <div><V2Pill href={`${ROUTES.shop}?tag=new`}>{p.cta}</V2Pill></div>
        </div>
      </div>
    </section>
  );
}
