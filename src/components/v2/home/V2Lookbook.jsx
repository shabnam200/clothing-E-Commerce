import { FiArrowUpRight } from "react-icons/fi";
import V2Coverflow from "@/components/v2/home/V2Coverflow";
import V2Pill from "@/components/v2/ui/V2Pill";
import { ROUTES } from "@/config/v2";
import { getCatalog } from "@/lib/v2/catalogSource";

// Lookbook slideshow uses the same live catalogue as the landing page product lists.
export default async function V2Lookbook({ v2, lang }) {
  const a = v2.about;
  const products = await getCatalog(lang);
  const items = products
    .filter((product) => product?.id != null && product?.image)
    .map((product) => ({
      id: product.id,
      src: product.image,
      alt: product.name || "",
    }));

  return (
    <section id="lookbook" className="v2-about" aria-label={v2.nav.lookbook}>
      <div className="v2-wrap">
        <div className="v2-center v2-lookhead">
          <p className="v2-eyebrow">{v2.nav.lookbook}</p>
        </div>
        {items.length > 0 ? (
          <V2Coverflow items={items} ctrl={a.ctrl} />
        ) : (
          <p className="v2-center" role="status">{a.more}</p>
        )}
        <div className="v2-center">
          <V2Pill href={ROUTES.shop} variant="outline">{a.more} <FiArrowUpRight aria-hidden="true" /></V2Pill>
        </div>
      </div>
    </section>
  );
}
