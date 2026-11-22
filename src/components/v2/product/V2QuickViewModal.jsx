"use client";

import V2SizeHint from "@/components/v2/product/V2SizeHint";
import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { firstAvailable, stockFor } from "@/lib/v2/stock";
import { getProductGallery } from "@/lib/v2/productImages";

export default function V2QuickViewModal({ p, onClose }) {
  const { addToCart, buyItNow, sizeLabel, recommendFor } = useV2Store();
  const rec = recommendFor(p);
  
  // Start on a size/colour that is really in stock.
  const start = firstAvailable(p, rec || "", p.colors?.[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState(start?.size || rec || p.sizes?.[0] || "ONE");
  const [selectedColor, setSelectedColor] = useState(start?.color ?? (p.colors?.[0]?.name || ""));
  const [qty, setQty] = useState(1);
  const sizeArg = selectedSize === "ONE" ? "" : selectedSize;
  const sizeOut = (s) => stockFor(p, s === "ONE" ? "" : s, selectedColor) <= 0;
  const colorOut = (c) => stockFor(p, sizeArg, c) <= 0;
  const out = stockFor(p, sizeArg, selectedColor) <= 0;

  const images = getProductGallery(p, selectedColor);
  const imagesKey = images.join("|");
  const [activeImg, setActiveImg] = useState(images[0]);
  useEffect(() => { setActiveImg(images[0]); }, [p.id, selectedColor, imagesKey]);

  const [zoomStyle, setZoomStyle] = useState({ transform: "scale(1)" });
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(2)" });
  };

  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => { setIsZoomed(false); setZoomStyle({ transform: "scale(1)" }); };

  return (
    <div className="v2-qv-overlay" onClick={onClose}>
      <div className="v2-qv-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="v2-qv-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>
        
        <div className="v2-qv-content">
          <div className="v2-qv-left">
            {images.length > 1 && (
              <div className="v2-qv-thumbnails">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    type="button" 
                    className={`v2-qv-thumb ${activeImg === img ? "active" : ""}`} 
                    onClick={() => setActiveImg(img)}
                  >
                    <div className="v2-media">
                      <RemoteImage src={img} alt={`view ${idx + 1}`} sizes="80px" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div 
              className="v2-qv-main-image" 
              onMouseMove={handleMouseMove} 
              onMouseEnter={handleMouseEnter} 
              onMouseLeave={handleMouseLeave}
            >
              <div style={{ transition: isZoomed ? "none" : "transform 0.3s ease", ...zoomStyle }}>
                <RemoteImage src={activeImg} alt={p.name} sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            </div>
          </div>

          <div className="v2-qv-right">
            <h2>{p.name}</h2>
            
            <div className="v2-qv-price-row">
              <span>{p.priceText}</span>
              {p.mrpText && <s>{p.mrpText}</s>}
            </div>

            <p className="v2-qv-desc">Explore our premium collection. Designed for ultimate comfort and confident styling in your everyday life.</p>

            {p.sizes && p.sizes.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontSize: "0.95rem", marginBottom: "10px", textTransform: "uppercase" }}>
                  Size: <strong>{sizeLabel(selectedSize)}</strong>
                </p>
                <div className="v2-chips">
                  {p.sizes.map((s) => (
                    <button 
                      key={s} 
                      type="button" 
                      className={`v2-chip${s === rec ? " is-rec" : ""}`} 
                      aria-current={selectedSize === s ? "true" : undefined} 
                      disabled={sizeOut(s)}
                      title={sizeOut(s) ? "Out of stock" : undefined}
                      style={sizeOut(s) ? { opacity: 0.4, textDecoration: "line-through", cursor: "not-allowed" } : undefined}
                      onClick={() => setSelectedSize(s)}
                    >
                      {sizeLabel(s)}
                    </button>
                  ))}
                </div>
                <V2SizeHint product={p} selected={selectedSize} onPick={setSelectedSize} />
              </div>
            )}

            {p.colors && p.colors.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <p style={{ fontSize: "0.95rem", marginBottom: "10px", textTransform: "uppercase" }}>
                  Color: <strong>{selectedColor}</strong>
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  {p.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={colorOut(c.name) ? `${c.name} — Out of stock` : c.name}
                      aria-label={c.name}
                      aria-pressed={selectedColor === c.name}
                      disabled={colorOut(c.name)}
                      onClick={() => { setSelectedColor(c.name); if (sizeArg && stockFor(p, sizeArg, c.name) <= 0) { const a = firstAvailable(p, "", c.name); if (a) setSelectedSize(a.size); } }}
                      style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: c.hex, padding: 0, cursor: colorOut(c.name) ? "not-allowed" : "pointer", opacity: colorOut(c.name) ? 0.35 : 1, border: selectedColor === c.name ? "2px solid var(--v2-ink)" : "1px solid var(--v2-line)", boxShadow: selectedColor === c.name ? "0 0 0 2px var(--v2-surface) inset" : "none" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {out && <p role="status" style={{ color: "var(--v2-sale)", marginBottom: "12px", fontSize: "0.9rem" }}>This size/colour is out of stock.</p>}

            <div className="v2-qv-actions">
              <button type="button" className="v2-qv-btn-primary" disabled={out} style={out ? { opacity: 0.5, cursor: "not-allowed" } : undefined} onClick={() => addToCart(p, selectedSize, selectedColor, qty)}>
                {out ? "OUT OF STOCK" : "ADD TO CART"}
              </button>
              <button type="button" className="v2-qv-btn-secondary" disabled={out} style={out ? { opacity: 0.5, cursor: "not-allowed" } : undefined} onClick={() => buyItNow(p, selectedSize, qty, selectedColor)}>
                BUY IT NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}