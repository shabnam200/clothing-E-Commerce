"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2QuickViewModal({ p, onClose }) {
  const { addToCart, buyItNow, sizeLabel } = useV2Store();
  
  const defaultSize = p.sizes?.[0] || "ONE";
  const [selectedSize, setSelectedSize] = useState(defaultSize);
  const [qty, setQty] = useState(1);

  const images = p.images || [p.image, p.hoverImage].filter(Boolean);
  const [activeImg, setActiveImg] = useState(images[0]);

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
                      className="v2-chip" 
                      aria-current={selectedSize === s ? "true" : undefined} 
                      onClick={() => setSelectedSize(s)}
                    >
                      {sizeLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="v2-qv-actions">
              <button type="button" className="v2-qv-btn-primary" onClick={() => addToCart(p, selectedSize, p.colors?.[0]?.name || "", qty)}>
                ADD TO CART
              </button>
              <button type="button" className="v2-qv-btn-secondary" onClick={() => buyItNow(p, selectedSize, qty)}>
                BUY IT NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}