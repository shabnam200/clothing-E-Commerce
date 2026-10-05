import { FiArrowUpRight, FiShoppingBag } from "react-icons/fi";
import V2Media from "@/components/v2/ui/V2Media";
import V2Pill from "@/components/v2/ui/V2Pill";
import { BANNERS } from "@/data/banners";
import { ROUTES } from "@/config/v2";

export default function V2Hero({ v2 }) {
  const h = v2.hero;
  return (
    <section className="v2-wrap v2-hero-wrap" aria-labelledby="v2-hero-title">
      <V2Media src={BANNERS.v2Hero} alt={h.alt} priority position="66% 20%" sizes="(min-width: 1360px) 1300px, 100vw" className="v2-hero">
        <div className="v2-hero__scrim" />
        <div className="v2-hero__content">
          <div className="v2-hero__main">
            <h1 id="v2-hero-title" className="v2-display">{h.pre} <em>{h.italic}</em> {h.post}</h1>
            <div className="v2-hero__ctas">
              <V2Pill href={ROUTES.lookbook} variant="ghost">{h.lookbook} <FiArrowUpRight aria-hidden="true" /></V2Pill>
              <V2Pill href={ROUTES.shop} variant="light">{h.shop} <FiShoppingBag aria-hidden="true" /></V2Pill>
            </div>
          </div>
          <p className="v2-hero__text">{h.text}</p>
        </div>
      </V2Media>
    </section>
  );
}
