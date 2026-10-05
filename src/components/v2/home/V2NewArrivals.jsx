import { FiArrowRight } from "react-icons/fi";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import V2SectionHead from "@/components/v2/ui/V2SectionHead";
import { buildV2Products } from "@/lib/v2/products";

export default function V2NewArrivals({ t, v2, lang }) {
  const a = v2.arrivals;
  const items = buildV2Products(t, lang);
  const labels = { addWish: v2.ui.addWish, removeWish: v2.ui.removeWish, colors: t.shop.color };
  return (
    <section id="new-arrivals" className="v2-section v2-band">
      <div className="v2-wrap">
        <V2SectionHead eyebrow={a.eyebrow} title={a.title} text={a.text}
          action={<a href="/v2#new-arrivals" className="v2-link-arrow">{a.viewAll} <FiArrowRight aria-hidden="true" /></a>} />
        <V2ProductGrid items={items} labels={labels} />
      </div>
    </section>
  );
}
