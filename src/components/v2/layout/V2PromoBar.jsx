"use client";

import { useState } from "react";
import Link from "next/link";
import { FiTag, FiX } from "react-icons/fi";

// Top offer bar. Colours come from the theme tokens (terracotta accent), see .v2-promobar in globals.css.
export default function V2PromoBar({ offer = null }) {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  const message = offer?.text || "Welcome to our store! Enjoy free shipping on all orders.";
  const content = (
    <>
      <FiTag className="v2-promobar__ico" aria-hidden="true" />
      <span>{message}</span>
      {offer?.href && <span className="v2-promobar__cta" aria-hidden="true">Shop now →</span>}
    </>
  );
  return (
    <div className="v2-promobar" role="region" aria-label="Offer">
      {offer?.href ? <Link href={offer.href} className="v2-promobar__row">{content}</Link> : <div className="v2-promobar__row">{content}</div>}
      <button type="button" className="v2-promobar__close" onClick={() => setIsVisible(false)} aria-label="Close offer">
        <FiX size={16} aria-hidden="true" /><span>close</span>
      </button>
    </div>
  );
}
