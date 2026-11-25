import { FiArrowUpRight } from "react-icons/fi";
import V2Coverflow from "@/components/v2/home/V2Coverflow";
import V2Pill from "@/components/v2/ui/V2Pill";
import { ROUTES } from "@/config/v2";
import { getCatalogPage, getCatalogProducts } from "@/lib/v2/catalogSource";

const LOOKBOOK_MAX = 12;

export default async function V2Lookbook({ v2, lang, settings, titleOverride = "" }) {
  const a = v2.about;
  const selected = settings?.lookbookProductIds;
  const groupingMode = settings?.storefrontGrouping?.mode || "category";
  const picked = Array.isArray(selected) ? selected.slice(0, LOOKBOOK_MAX) : []; // the slider shows a dozen: do not read more products than that
  // Same request as the home "New arrivals" section (newest 24, answered from the shared cache), then keep the newest 12:
  // the lookbook no longer makes a call of its own.
  const products = picked.length
    ? await getCatalogProducts(picked, lang, groupingMode)
    : (await getCatalogPage(lang, groupingMode, { page: 1, limit: 24, latest: true })).items.slice(-LOOKBOOK_MAX);
  const ordered = picked.length
    ? picked.map((id) => products.find((product) => String(product.id) === String(id))).filter(Boolean)
    : products;
  const items = ordered
    .filter((product) => product?.id != null && product?.image)
    .map((product) => ({ id: product.id, src: product.image, alt: product.name || "" }));

  return (
    <section id="lookbook" className="v2-about" aria-label={v2.nav.lookbook}>
      <div className="v2-wrap">
        <div className="v2-sechead v2-reveal">
          <div className="v2-sechead__title">
            <p className="v2-eyebrow">{v2.nav.lookbook}</p>
            <h2 className="v2-display v2-h2">{titleOverride || a.title}</h2>
          </div>
        </div>
        {items.length > 0 ? <V2Coverflow items={items} ctrl={a.ctrl} /> : <p className="v2-center" role="status">{a.more}</p>}
        <div className="v2-center"><V2Pill href={ROUTES.shop} variant="outline">{a.more} <FiArrowUpRight aria-hidden="true" /></V2Pill></div>
      </div>
    </section>
  );
}
