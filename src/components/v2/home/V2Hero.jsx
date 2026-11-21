import { FiArrowUpRight, FiShoppingBag } from "react-icons/fi";
import V2Media from "@/components/v2/ui/V2Media";
import V2Pill from "@/components/v2/ui/V2Pill";
import { BANNERS } from "@/data/banners";
import { ROUTES } from "@/config/v2";

export default function V2Hero({ v2, campaign = null, highlights = [] }) {
  const h = v2.hero;
  const image = campaign?.image || BANNERS.v2Hero;
  return (
    <section aria-labelledby="v2-hero-title" style={{ width: '100%', margin: 0, padding: 0 }}>
      <V2Media src={image} alt={h.alt} priority unoptimized={!!campaign?.image} position="66% 20%" sizes="100vw" className="v2-hero" style={{ width: '100%', borderRadius: 0 }}>
        <div className="v2-hero__scrim" />
        <div className="v2-hero__content">
          <div className="v2-hero__main">
            <h1 id="v2-hero-title" className="v2-display">{campaign?.title || <>{h.pre} <em>{h.italic}</em> {h.post}</>}</h1>
            <div className="v2-hero__ctas">
              <V2Pill href={ROUTES.lookbook} variant="ghost">{h.lookbook} <FiArrowUpRight aria-hidden="true" /></V2Pill>
              <V2Pill href={campaign?.href || ROUTES.shop} variant="light">{h.shop} <FiShoppingBag aria-hidden="true" /></V2Pill>
            </div>
          </div>
          <div className="v2-hero__aside">
            <p className="v2-hero__text">{campaign?.text || h.text}</p>
            {highlights.length > 0 && <ul className="v2-hero__highlights">{highlights.filter(Boolean).slice(0, 8).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>}
          </div>
        </div>
      </V2Media>
    </section>
  );
}
