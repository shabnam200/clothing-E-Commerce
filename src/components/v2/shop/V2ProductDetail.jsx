"use client";

import { useState } from "react";
import Link from "next/link";
import { FiHeart, FiMinus, FiPlus, FiShoppingBag, FiStar, FiBell, FiTwitter, FiFacebook, FiMail, FiX, FiInfo } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { MAX_QTY } from "@/config/v2";
import { shopHref } from "@/lib/v2/filters";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2ProductDetail({ p }) {
  const { ui, labels, addToCart, isWished, toggleWish, sizeLabel } = useV2Store();
  
  const [size, setSize] = useState(p.sizes?.length === 1 ? p.sizes[0] : "");
  const [color, setColor] = useState(p.colors?.[0]?.name || "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  
  const allImages = [
    p.image, 
    p.hoverImage || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop", 
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop"
  ].filter(Boolean);
  
  const [activeImg, setActiveImg] = useState(allImages[0]);
  const [zoom, setZoom] = useState({ show: false, x: 0, y: 0 });

  const wished = isWished(p.id);
  const stock = p.stock ?? 10; 
  const isOutOfStock = stock === 0;

  const onAdd = () => {
    if (!size || (p.colors?.length > 0 && !color)) { 
      setError(true); 
      return; 
    }
    addToCart(p, size, color, qty);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoom({ show: true, x, y });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', maxWidth: '1050px', margin: '0 auto', padding: '20px 15px', alignItems: 'flex-start' }}>
      
      {/* LEFT: Media Section */}
      <div style={{ display: 'flex', gap: '12px', flex: '1 1 450px', maxWidth: '550px', position: 'sticky', top: '90px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '70px', flexShrink: 0 }}>
          {allImages.map((img, idx) => (
            <button 
              key={idx} type="button" onClick={() => setActiveImg(img)}
              style={{ 
                padding: 0, border: activeImg === img ? '1px solid var(--v2-ink)' : '1px solid transparent', 
                background: 'var(--v2-tile)', cursor: 'pointer', aspectRatio: '3/4', borderRadius: '4px', overflow: 'hidden', opacity: activeImg === img ? 1 : 0.6, transition: '0.2s'
              }}
            >
              <div className="v2-media" style={{ width: '100%', height: '100%' }}>
                <RemoteImage src={img} alt={`thumb-${idx}`} sizes="70px" />
              </div>
            </button>
          ))}
        </div>

        <div 
          style={{ flex: 1, position: 'relative', overflow: 'hidden', aspectRatio: '3/4', borderRadius: '6px', background: 'var(--v2-tile)', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove} onMouseLeave={() => setZoom({ show: false, x: 0, y: 0 })}
        >
          <div className="v2-media" style={{ 
              width: '100%', height: '100%',
              transform: zoom.show ? 'scale(2.2)' : 'scale(1)',
              transformOrigin: `${zoom.x}% ${zoom.y}%`,
              transition: zoom.show ? 'none' : 'transform 0.3s ease-out'
            }}>
            <RemoteImage src={activeImg} alt={p.name} priority sizes="(min-width: 900px) 40vw, 100vw" />
          </div>
          
          {p.discountText && !zoom.show && <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--v2-sale)', color: 'var(--v2-on-sale)', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', zIndex: 2 }}>{p.discountText}</span>}
          {isOutOfStock && !zoom.show && <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--v2-sale)', color: 'var(--v2-on-sale)', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', zIndex: 2 }}>Sold Out</span>}
        </div>
      </div>

      {/* RIGHT: Info Section */}
      <div style={{ flex: '1 1 350px', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '5px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href={shopHref({ category: p.category })} style={{ fontSize: '12px', color: 'var(--v2-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{p.categoryLabel}</Link>
          <h1 style={{ fontSize: '26px', fontWeight: '600', margin: 0, color: 'var(--v2-ink)', lineHeight: '1.2' }}>{p.name}</h1>
          <p style={{ fontSize: '13px', margin: 0, color: 'var(--v2-muted)' }}>
            <FiStar fill="currentColor" style={{ color: '#f59e0b', marginRight: '4px' }} />
            <span>{p.ratingText} · {p.reviewsText} {labels?.reviews || 'reviews'}</span>
          </p>
          <p style={{ fontSize: '20px', margin: '4px 0 0 0', fontWeight: '500', color: 'var(--v2-ink)' }}>
            <span>{p.priceText}</span>{p.mrpText && <s style={{ fontSize: '16px', color: 'var(--v2-muted)', marginLeft: '8px' }}>{p.mrpText}</s>}
          </p>
        </div>
        
        <p style={{ fontSize: '13.5px', lineHeight: '1.5', margin: 0, color: 'var(--v2-muted)' }}>{p.description}</p>

        {p.colors && p.colors.length > 0 && (
          <div style={{ marginTop: '5px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--v2-ink)', display: 'block', marginBottom: '8px' }}>COLOR{color && <span style={{ fontWeight: '400' }}>: {color}</span>}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {p.colors.map((c) => (
                <button 
                  key={c.name} title={c.name} type="button" onClick={(e) => { e.preventDefault(); setColor(c.name); setError(false); }}
                  style={{ 
                    width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', padding: 0,
                    backgroundColor: c.hex, border: color === c.name ? '2px solid var(--v2-ink)' : '1px solid var(--v2-line)',
                    boxShadow: color === c.name ? '0 0 0 2px var(--v2-card) inset' : 'none', transition: 'all 0.2s'
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--v2-ink)' }}>SIZE{size && <span style={{ fontWeight: '400' }}>: {sizeLabel(size)}</span>}</span>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSizeGuide(true); }} style={{ background: 'none', border: 'none', color: 'var(--v2-muted)', textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 0' }}>
              <FiInfo /> Size Guide
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {p.sizes.map((s) => (
              <button 
                key={s} type="button" disabled={isOutOfStock} onClick={(e) => { e.preventDefault(); setSize(s); setError(false); }}
                style={{ 
                  minWidth: '40px', height: '40px', padding: '0 12px', borderRadius: '30px', cursor: isOutOfStock ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s',
                  background: size === s ? 'var(--v2-ink)' : 'var(--v2-card)', color: size === s ? 'var(--v2-card)' : 'var(--v2-ink)', border: size === s ? '1px solid var(--v2-ink)' : '1px solid var(--v2-line)',
                  opacity: isOutOfStock ? 0.5 : 1, textDecoration: isOutOfStock ? 'line-through' : 'none'
                }}
              >
                {sizeLabel(s)}
              </button>
            ))}
          </div>
          {error && <p style={{ color: 'var(--v2-sale)', fontSize: '12.5px', marginTop: '6px', marginBottom: 0 }}>Please select size & color!</p>}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--v2-line)', borderRadius: '30px', height: '46px', padding: '0 10px', background: 'var(--v2-card)' }}>
            <button type="button" disabled={qty <= 1 || isOutOfStock} onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-ink)', padding: '5px' }}><FiMinus /></button>
            <span style={{ fontSize: '14px', width: '30px', textAlign: 'center', fontWeight: '500', color: 'var(--v2-ink)' }}>{qty}</span>
            <button type="button" disabled={qty >= Math.min(MAX_QTY, stock) || isOutOfStock} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--v2-ink)', padding: '5px' }}><FiPlus /></button>
          </div>
          <button type="button" disabled={isOutOfStock} onClick={onAdd} style={{ flex: 1, minWidth: '160px', height: '46px', borderRadius: '30px', border: 'none', fontSize: '13.5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', opacity: isOutOfStock ? 0.6 : 1, backgroundColor: isOutOfStock ? 'var(--v2-tile)' : '#56cfe1', color: isOutOfStock ? 'var(--v2-muted)' : '#fff', cursor: isOutOfStock ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
            {isOutOfStock ? "Out of Stock" : labels?.add || "Add to Cart"}
          </button>
          <button type="button" onClick={() => toggleWish(p)} style={{ width: '46px', height: '46px', borderRadius: '50%', border: '1px solid var(--v2-line)', background: 'var(--v2-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: wished ? 'var(--v2-sale)' : 'var(--v2-ink)', transition: '0.2s' }}>
            <FiHeart fill={wished ? "currentColor" : "none"} size={18} />
          </button>
        </div>

        {isOutOfStock && (
          <div style={{ border: '1px solid var(--v2-line)', padding: '15px', borderRadius: '6px', background: 'var(--v2-card)', marginTop: '5px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', marginBottom: '8px', color: 'var(--v2-ink)' }}><FiBell /> Notify me if back in stock</h4>
            <input type="email" placeholder="Email*" style={{ width: '100%', padding: '10px', border: '1px solid var(--v2-line)', borderRadius: '4px', marginBottom: '8px', background: 'var(--v2-bg)', color: 'var(--v2-ink)', outline: 'none', fontSize: '13px' }} />
            <button type="button" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--v2-btn-bg)', color: 'var(--v2-btn-fg)', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Submit</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px', paddingTop: '15px', borderTop: '1px solid var(--v2-line)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['Amazon', 'Amex', 'ApplePay', 'Bitcoin', 'Klarna', 'Mastercard', 'Visa'].map((pay) => (
              <span key={pay} style={{ fontSize: '9.5px', border: '1px solid var(--v2-line)', padding: '3px 6px', borderRadius: '3px', fontWeight: '600', color: 'var(--v2-muted)', background: 'var(--v2-card)' }}>{pay}</span>
            ))}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--v2-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ margin: 0 }}>Availability: <span style={{ color: isOutOfStock ? 'var(--v2-sale)' : 'var(--v2-ink)', fontWeight: 500 }}>{isOutOfStock ? 'Out of stock' : 'In stock'}</span></p>
            <p style={{ margin: 0 }}>Categories: <Link href={shopHref({ category: p.category })} style={{ color: 'var(--v2-ink)', fontWeight: 500 }}>{p.categoryLabel}</Link></p>
          </div>

          <div style={{ display: 'flex', gap: '12px', color: 'var(--v2-ink)', marginTop: '4px' }}>
            <FiFacebook size={16} cursor="pointer" /><FiTwitter size={16} cursor="pointer" /><FiMail size={16} cursor="pointer" />
          </div>
        </div>
      </div>

      {/* NEW SIZE GUIDE MODAL (Solid Background & No Measuring Tips) */}
      {showSizeGuide && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} 
          onClick={() => setShowSizeGuide(false)}
        >
          {/* Explicit solid background color for modal */}
          <div 
            style={{ background: 'var(--v2-card, #111111)', color: 'var(--v2-ink, #ffffff)', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '8px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button" onClick={() => setShowSizeGuide(false)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--v2-tile, #333333)', color: 'var(--v2-ink, #ffffff)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, transition: '0.2s' }}
            >
              <FiX />
            </button>

            <div style={{ padding: '40px 30px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: '700', marginBottom: '30px', color: 'var(--v2-ink, #ffffff)' }}>Size guide</h2>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '500px' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px 12px', borderBottom: '1px solid var(--v2-line, #333333)', fontWeight: '700', color: 'var(--v2-muted, #888888)' }}>Size</th>
                      <th style={{ padding: '14px 12px', borderBottom: '1px solid var(--v2-line, #333333)', fontWeight: '700', color: 'var(--v2-muted, #888888)' }}>US</th>
                      <th style={{ padding: '14px 12px', borderBottom: '1px solid var(--v2-line, #333333)', fontWeight: '700', color: 'var(--v2-muted, #888888)' }}>Bust</th>
                      <th style={{ padding: '14px 12px', borderBottom: '1px solid var(--v2-line, #333333)', fontWeight: '700', color: 'var(--v2-muted, #888888)' }}>Waist</th>
                      <th style={{ padding: '14px 12px', borderBottom: '1px solid var(--v2-line, #333333)', fontWeight: '700', color: 'var(--v2-muted, #888888)' }}>Low Hip</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['XS', '2', '32', '24 - 25', '33 - 34'],
                      ['S', '4', '34 - 35', '26 - 27', '35 - 36'],
                      ['M', '6', '36 - 37', '28 - 29', '38 - 40'],
                      ['L', '8', '38 - 39', '30 - 31', '42 - 44'],
                      ['XL', '10', '40 - 41', '32 - 33', '45 - 47'],
                      ['XXL', '12', '42 - 43', '34 - 35', '48 - 50']
                    ].map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '14px 12px', borderBottom: '1px solid var(--v2-line, #333333)', color: 'var(--v2-ink, #ffffff)' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}