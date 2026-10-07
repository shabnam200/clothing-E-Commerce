"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiHeart, FiShoppingBag, FiStar } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

// Compact Timer for the Card
function CardCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;
    
    const calculate = () => {
      const diff = +new Date(targetDate) - +new Date();
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };
    
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '6px 0', textAlign: 'center', zIndex: 3, letterSpacing: '1px', pointerEvents: 'none' }}>
      {timeLeft.d}d : {timeLeft.h.toString().padStart(2, '0')}h : {timeLeft.m.toString().padStart(2, '0')}m : {timeLeft.s.toString().padStart(2, '0')}s
    </div>
  );
}

export default function V2ProductCard({ p }) {
  const { isWished, toggleWish, labels, openQuickView, quickAdd } = useV2Store();
  const wished = isWished(p.id);
  const href = ROUTES.product(p.id);
  
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState(p.colors?.[0]?.name || "");
  
  const displayImage = (isHovered && p.hoverImage) ? p.hoverImage : p.image;
  
  const hasDiscount = Boolean(p.discountText || p.mrpText);
  const stock = p.stock ?? 10;
  const isOutOfStock = stock === 0;

  // NEW: Dynamic Sale End Date from product data
  // Apnar API ba catalog data-te "saleEndDate" property thakte hobe (e.g., saleEndDate: "2026-11-20T10:00:00")
  const saleEndDate = p.saleEndDate ? new Date(p.saleEndDate) : null;

  return (
    <article className="v2-pcard" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      <div className="v2-pcard__media" style={{ overflow: "hidden", position: "relative", aspectRatio: "3/4", borderRadius: "8px", background: "var(--v2-tile)" }}>
        
        <Link href={href} style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
          <div className="v2-media" style={{ transition: "transform 0.4s ease", transform: isHovered ? "scale(1.15)" : "scale(1)", width: '100%', height: '100%' }}>
            <RemoteImage src={displayImage} alt={p.name} sizes="(min-width: 1200px) 19vw, (min-width: 900px) 24vw, (min-width: 600px) 32vw, 48vw" style={{ objectFit: "cover", width: '100%', height: '100%' }} />
          </div>
        </Link>
        
        {p.discountText && <span className="v2-pcard__badge" style={{ position: 'absolute', top: '10px', right: '10px', background: '#ff4e00', color: '#fff', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '50%', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>{p.discountText}</span>}
        
        <button type="button" className="v2-pcard__wish" aria-pressed={wished} aria-label={`${wished ? labels?.unwish : labels?.wish}: ${p.name}`} onClick={(e) => { e.preventDefault(); toggleWish(p); }} style={{ position: 'absolute', top: '10px', left: '10px', background: 'none', border: 'none', color: wished ? 'var(--v2-sale, #f5554a)' : '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))', cursor: 'pointer', zIndex: 3 }}>
          <FiHeart aria-hidden="true" fill={wished ? "currentColor" : "none"} size={22} strokeWidth={wished ? 0 : 2} />
        </button>
        
        <div className="v2-pcard__actions" style={{ position: 'absolute', bottom: '36px', left: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '0 10px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.3s', zIndex: 4, pointerEvents: isHovered ? 'auto' : 'none' }}>
          <button type="button" className="v2-pcard__qv" style={{ background: '#fff', color: '#222', border: 'none', padding: '10px 0', borderRadius: '30px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', width: '80%', maxWidth: '180px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} onClick={(e) => { e.preventDefault(); if (openQuickView) openQuickView(p); }}>
            {labels?.quick || "Quick view"}
          </button>
          <button type="button" className="v2-pcard__add" style={{ background: '#56cfe1', color: '#fff', border: 'none', padding: '10px 0', borderRadius: '30px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '80%', maxWidth: '180px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} onClick={(e) => { e.preventDefault(); quickAdd(p); }}>
            <FiShoppingBag aria-hidden="true" /> <span>{labels?.add || "Quick add"}</span>
          </button>
        </div>

        {/* Dynamic Countdown: Rendered only if in stock, has discount, AND has a specific saleEndDate */}
        {!isOutOfStock && hasDiscount && saleEndDate && <CardCountdown targetDate={saleEndDate} />}
      </div>

      <div className="v2-pcard__info" style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <p className="v2-pcard__cat" style={{ fontSize: '12px', color: 'var(--v2-muted)', margin: 0 }}>{p.categoryLabel}</p>
        <h3 style={{ fontSize: '15px', fontWeight: '500', margin: 0 }}>
          <Link href={href} style={{ display: 'block', color: 'inherit' }}>{p.name}</Link>
        </h3>
        <div className="v2-pcard__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          <p className="v2-price" style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
            <span>{p.priceText}</span>
            {p.mrpText && <s style={{ fontSize: '13px', opacity: 0.7, marginLeft: '6px' }}>{p.mrpText}</s>}
          </p>
          <p className="v2-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', margin: 0 }} aria-label={`${labels?.ratingOf || "Rating"} ${p.ratingText} (${p.reviewsText} ${labels?.reviews || "reviews"})`}>
            <FiStar aria-hidden="true" fill="#f59e0b" color="#f59e0b" /> <span aria-hidden="true">{p.ratingText}</span>
          </p>
        </div>

        {p.colors && p.colors.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
            {p.colors.map((c) => (
              <button 
                key={c.name} title={c.name} 
                onClick={(e) => { e.preventDefault(); setActiveColor(c.name); }}
                onMouseEnter={() => setActiveColor(c.name)}
                style={{ 
                  width: '16px', height: '16px', borderRadius: '50%', cursor: 'pointer',
                  backgroundColor: c.hex, 
                  border: activeColor === c.name ? '1px solid var(--v2-ink)' : '1px solid var(--v2-line)',
                  boxShadow: activeColor === c.name ? '0 0 0 2px var(--v2-card) inset' : 'none',
                  padding: 0, transition: 'all 0.2s'
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}