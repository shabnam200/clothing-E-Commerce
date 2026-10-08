"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiBell, FiHeart, FiShoppingBag, FiStar, FiEye } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { useAlerts } from "@/lib/v2/priceAlerts";

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
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(15, 15, 15, 0.85)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: '11px', fontWeight: '500', padding: '8px 0', textAlign: 'center', zIndex: 3, letterSpacing: '1.5px', pointerEvents: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      {timeLeft.d}D : {timeLeft.h.toString().padStart(2, '0')}H : {timeLeft.m.toString().padStart(2, '0')}M : {timeLeft.s.toString().padStart(2, '0')}S
    </div>
  );
}

export default function V2ProductCard({ p }) {
  const { isWished, toggleWish, labels, openQuickView, quickAdd, toggleAlert, alertsCopy } = useV2Store();
  const wished = isWished(p.id);
  const alertOn = Boolean(useAlerts().items[String(p.id)]);
  const href = ROUTES.product(p.id);
  
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState(p.colors?.[0]?.name || "");
  
  const displayImage = (isHovered && p.hoverImage) ? p.hoverImage : p.image;
  
  const hasDiscount = Boolean(p.discountText || p.mrpText);
  const stock = p.stock ?? 10;
  const isOutOfStock = stock === 0;
  const saleEndDate = p.saleEndDate ? new Date(p.saleEndDate) : null;

  return (
    <article 
      className="v2-pcard" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
      style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s ease' }}
    >
      
      <div className="v2-pcard__media" style={{ overflow: "hidden", position: "relative", aspectRatio: "3/4", borderRadius: "8px", background: "var(--v2-tile, #111)" }}>
        
        <Link href={href} style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
          <div className="v2-media" style={{ transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)", transform: isHovered ? "scale(1.15)" : "scale(1)", width: '100%', height: '100%' }}>
            <RemoteImage src={displayImage} alt={p.name} sizes="(min-width: 1200px) 19vw, (min-width: 900px) 24vw, (min-width: 600px) 32vw, 48vw" style={{ objectFit: "cover", width: '100%', height: '100%' }} />
          </div>
        </Link>
        
        {hasDiscount && (
          <span className="v2-pcard__badge" style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--v2-surface)', color: 'var(--v2-ink)', padding: '4px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', zIndex: 2, pointerEvents: 'none', borderRadius: '2px' }}>
            {p.discountText || "SALE"}
          </span>
        )}
        
        <button type="button" className="v2-pcard__wish" aria-pressed={wished} aria-label={`${wished ? labels?.unwish : labels?.wish}: ${p.name}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(p); }} style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', padding: '8px', color: wished ? '#f5554a' : '#fff', cursor: 'pointer', zIndex: 3, transition: 'all 0.2s', display: 'flex' }}>
          <FiHeart aria-hidden="true" fill={wished ? "currentColor" : "none"} size={16} strokeWidth={wished ? 0 : 1.5} />
        </button>
        
        {wished && alertsCopy && (
          <button type="button" className="v2-pcard__alert" aria-pressed={alertOn} aria-label={`${alertsCopy.toggle}: ${p.name}`} title={alertsCopy.toggle} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAlert(p); }} style={{ position: 'absolute', top: '54px', left: '10px', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', padding: '8px', color: alertOn ? '#f0b94d' : '#fff', cursor: 'pointer', zIndex: 3, transition: 'all 0.2s', display: 'flex' }}>
            <FiBell aria-hidden="true" fill={alertOn ? "currentColor" : "none"} size={16} strokeWidth={alertOn ? 0 : 1.5} />
          </button>
        )}

        <div className="v2-pcard__actions">
          <button type="button" className="v2-pcard__qv" onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (openQuickView) openQuickView(p); }}>
            {labels?.quick || "Quick view"}
          </button>
          <button type="button" className="v2-pcard__add" onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickAdd(p); }}>
            <FiShoppingBag aria-hidden="true" /> <span>{labels?.add || "Quick add"}</span>
          </button>
        </div>

        {!isOutOfStock && hasDiscount && saleEndDate && <CardCountdown targetDate={saleEndDate} />}
      </div>

      <div className="v2-pcard__info" style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <p className="v2-pcard__cat" style={{ fontSize: '12px', color: 'var(--v2-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{p.categoryLabel}</p>
        <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: 'var(--v2-ink, #fff)', letterSpacing: '0.5px' }}>
          <Link href={href} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>{p.name}</Link>
        </h3>
        <div className="v2-pcard__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          <p className="v2-price" style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--v2-ink)' }}>
            <span>{p.priceText}</span>
            {p.mrpText && <s style={{ fontSize: '12px', color: 'var(--v2-muted)', marginLeft: '6px', fontWeight: '400' }}>{p.mrpText}</s>}
          </p>
          <p className="v2-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', margin: 0, color: 'var(--v2-ink)' }} aria-label={`${labels?.ratingOf || "Rating"} ${p.ratingText} (${p.reviewsText} ${labels?.reviews || "reviews"})`}>
            <FiStar aria-hidden="true" fill="var(--v2-star)" color="var(--v2-star)" size={12} /> <span aria-hidden="true">{p.ratingText}</span>
          </p>
        </div>

        {p.colors && p.colors.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
            {p.colors.map((c) => (
              <button 
                key={c.name} title={c.name} 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveColor(c.name); }}
                onMouseEnter={() => setActiveColor(c.name)}
                style={{ 
                  width: '16px', height: '16px', borderRadius: '50%', cursor: 'pointer',
                  backgroundColor: c.hex, 
                  border: activeColor === c.name ? '1px solid var(--v2-ink)' : '1px solid var(--v2-line)',
                  boxShadow: activeColor === c.name ? '0 0 0 2px var(--v2-surface) inset' : 'none',
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