"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiTag, FiX } from "react-icons/fi";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import V2OfferCountdown from "@/components/v2/campaign/V2OfferCountdown";

const COPY = {
  en: { fallback: "Welcome to our store! Enjoy free shipping on all orders.", cta: "Shop now →", close: "close", closeLabel: "Close offer", region: "Offer" },
  bn: { fallback: "আমাদের স্টোরে স্বাগতম! সব অর্ডারে ফ্রি ডেলিভারি উপভোগ করুন।", cta: "এখনই কিনুন →", close: "বন্ধ করুন", closeLabel: "অফার বন্ধ করুন", region: "অফার" },
};

// Top offer bar. Colours come from the theme tokens (terracotta accent), see .v2-promobar in globals.css.
export default function V2PromoBar({ offer = null }) {
  const { lang } = useV2Store();
  const c = COPY[lang === "en" ? "en" : "bn"];
  const validLabel = lang === "en" ? "Valid" : "\u09AE\u09C7\u09DF\u09BE\u09A6";
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    if (!offer?.endsAt) return undefined;
    const hideExpired = () => { if (Date.now() >= offer.endsAt) setIsVisible(false); };
    hideExpired();
    const timer = setInterval(hideExpired, 30_000);
    return () => clearInterval(timer);
  }, [offer?.endsAt]);
  if (!isVisible) return null;

  const message = offer?.text || c.fallback;
  const content = (
    <>
      <FiTag className="v2-promobar__ico" aria-hidden="true" />
      {offer?.discount && <strong className="v2-promobar__off">{offer.discount}</strong>}
      <span>{message}</span>
      {offer?.validity && <small className="v2-promobar__validity">{validLabel}: {offer.validity}</small>}
      {offer?.validity && offer.endsAt && <V2OfferCountdown deadline={offer.endsAt} lang={lang} className="v2-promobar__countdown" />}
      {offer?.href && <span className="v2-promobar__cta" aria-hidden="true">{c.cta}</span>}
    </>
  );
  return (
    <div className="v2-promobar" role="region" aria-label={c.region}>
      {offer?.href ? <Link href={offer.href} className="v2-promobar__row">{content}</Link> : <div className="v2-promobar__row">{content}</div>}
      <button type="button" className="v2-promobar__close" onClick={() => setIsVisible(false)} aria-label={c.closeLabel}>
        <FiX size={16} aria-hidden="true" /><span>{c.close}</span>
      </button>
    </div>
  );
}
