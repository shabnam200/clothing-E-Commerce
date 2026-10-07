import Link from "next/link";
import V2ProductGrid from "./V2ProductGrid";
import { shopHref } from "@/lib/v2/filters";

export default function V2ProductShowcase({ items, tag, title, eyebrow, viewAll }) {
  // Only 10 products for the slider
  const visible = items.filter((i) => i.tags.includes(tag)).slice(0, 10);

  if (visible.length === 0) return null;

  return (
    <section className="v2-block" aria-labelledby={`v2-${tag}-title`} style={{ paddingBottom: '40px' }}>
      
      {/* Header section with Centered Title and View All Button on the right */}
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '30px', padding: '0 15px' }}>
        
        {/* 1. Left Spacer (Eta title ke perfectly center-e rakhte sahajjo korbe) */}
        <div style={{ flex: 1 }}></div>

        {/* 2. Centered Title */}
        <div style={{ textAlign: 'center' }}>
          {eyebrow && (
            <p className="v2-eyebrow" style={{ color: '#888', letterSpacing: '2px', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>
              {eyebrow}
            </p>
          )}
          <h2 id={`v2-${tag}-title`} className="v2-display v2-h2" style={{ margin: 0 }}>
            {title}
          </h2>
        </div>
        
        {/* 3. View All Button on Top Right */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Link href={shopHref({ tag })} style={{ 
            fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px', 
            borderBottom: '1px solid #ffffff', paddingBottom: '4px', color: '#ffffff', transition: 'all 0.2s' 
          }}>
            {viewAll}
          </Link>
        </div>

      </div>
      
      {/* Product Slider */}
      <div>
        <V2ProductGrid items={visible} className="v2-slider-grid" />
      </div>
    </section>
  );
}