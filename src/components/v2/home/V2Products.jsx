import V2ProductShowcase from "@/components/v2/product/V2ProductShowcase";
import { getCatalog } from "@/lib/v2/catalogSource";

export default async function V2Products({ v2, lang }) {
  const p = v2.products;
  const catalogItems = await getCatalog(lang);

  return (
    <div id="our-picks" style={{ padding: '0 15px' }}>
      {/* 1st Row: New Arrivals */}
      <V2ProductShowcase 
        items={catalogItems} 
        tag="new" 
        title={p.tabs?.new || "New Arrivals"} 
        eyebrow={p.eyebrow} 
        viewAll={p.viewAll} 
      />
      
      {/* 2nd Row: Best Sellers */}
      <V2ProductShowcase 
        items={catalogItems} 
        tag="best" 
        title={p.tabs?.best || "Best Sellers"} 
        viewAll={p.viewAll} 
      />
    </div>
  );
}