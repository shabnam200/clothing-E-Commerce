import V2ProductShowcase from "@/components/v2/product/V2ProductShowcase";
import { getCatalog } from "@/lib/v2/catalogSource";

export default async function V2Products({ v2, lang }) {
  const p = v2.products;
  const catalogItems = await getCatalog(lang);
  const newest = [...catalogItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || Number(b.id) - Number(a.id));
  const bestSelling = [...catalogItems].sort((a, b) => (b.soldTotal || 0) - (a.soldTotal || 0) || (b.createdAt || 0) - (a.createdAt || 0));
  const hasSales = bestSelling.some((item) => (item.soldTotal || 0) > 0);

  return (
    <div id="our-picks" style={{ padding: "0 15px" }}>
      <V2ProductShowcase items={newest} automatic tag="new" title={p.tabs?.new || "New Arrivals"} eyebrow={p.eyebrow} viewAll={p.viewAll} />
      <V2ProductShowcase items={hasSales ? bestSelling : []} automatic tag="best" title={p.tabs?.best || "Best Sellers"} viewAll={p.viewAll} />
    </div>
  );
}
