import V2ProductShowcase from "@/components/v2/product/V2ProductShowcase";
import { getCatalog } from "@/lib/v2/catalogSource";

export default async function V2Products({ v2, lang, settings }) {
  const p = v2.products;
  const catalogItems = await getCatalog(lang);
  const picks = settings?.homePicks;

  return (
    <div id="our-picks" style={{ padding: "0 15px" }}>
      <V2ProductShowcase items={catalogItems} selectedIds={picks?.new_arrivals} tag="new" title={p.tabs?.new || "New Arrivals"} eyebrow={p.eyebrow} viewAll={p.viewAll} />
      <V2ProductShowcase items={catalogItems} selectedIds={picks?.best_sellers} tag="best" title={p.tabs?.best || "Best Sellers"} viewAll={p.viewAll} />
    </div>
  );
}