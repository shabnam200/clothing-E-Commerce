import V2ProductShowcase from "@/components/v2/product/V2ProductShowcase";
import { buildCatalog } from "@/lib/v2/catalog";

// Server side: language-ready items come from the shared catalog (same data the shop, cart and search use).
export default function V2Products({ v2, lang }) {
  const p = v2.products;
  return <V2ProductShowcase items={buildCatalog(v2, lang)} tabLabels={p.tabs} tabsLabel={p.tabsLabel} eyebrow={p.eyebrow} viewAll={p.viewAll} />;
}
