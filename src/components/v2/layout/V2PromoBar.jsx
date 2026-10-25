"use client";

import { useState } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";

export default function V2PromoBar({ offer = null }) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  const message = offer?.text || "Welcome to our store! Enjoy free shipping on all orders.";
  return (
    <div style={{ background: 'var(--v2-card, #111111)', color: 'var(--v2-ink, #ffffff)', borderBottom: '1px solid var(--v2-line)', padding: '10px 15px', position: 'relative', fontSize: '13px', fontWeight: '500', textAlign: 'center', zIndex: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '20px' }}>
        {offer?.href ? <Link href={offer.href} className="promo-fade">{message}</Link> : <span className="promo-fade">{message}</span>}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--v2-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.8 }}
      >
        <FiX size={16} /> close
      </button>
    </div>
  );
}
