"use client";

import { useState } from "react";
import Link from "next/link";
import { FiCheck, FiHeart, FiMinus, FiPlus, FiShoppingBag, FiStar, FiTruck, FiRefreshCw, FiLock } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { MAX_QTY } from "@/config/v2";
import { shopHref } from "@/lib/v2/filters";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

const PERK_ICONS = [FiTruck, FiRefreshCw, FiLock];

// Reusable product details block: large image, price, size picker, quantity, add to cart, wishlist.
export default function V2ProductDetail({ p, copy, perks }) {
  const { ui, labels, addToCart, isWished, toggleWish, sizeLabel } = useV2Store();
  const [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);
  const wished = isWished(p.id);

  const onAdd = () => {
    if (!size) { setError(true); return; }
    addToCart(p, size, qty);
  };

  return (
    <div className="v2-pd__grid">
      <div className="v2-pd__media">
        <div className="v2-media"><RemoteImage src={p.image} alt={p.name} priority sizes="(min-width: 900px) 52vw, 100vw" /></div>
        {p.discountText && <span className="v2-pcard__badge">{p.discountText}</span>}
      </div>
      <div className="v2-pd__info">
        <Link href={shopHref({ category: p.category })} className="v2-pcard__cat v2-pd__cat">{p.categoryLabel}</Link>
        <h1 className="v2-display v2-pd__title">{p.name}</h1>
        <p className="v2-rating v2-pd__rating" aria-label={`${labels.ratingOf} ${p.ratingText} (${p.reviewsText} ${labels.reviews})`}>
          <FiStar aria-hidden="true" fill="currentColor" /> <span aria-hidden="true">{p.ratingText} · {p.reviewsText} {labels.reviews}</span>
        </p>
        <p className="v2-price v2-pd__price"><span>{p.priceText}</span>{p.mrpText && <s>{p.mrpText}</s>}</p>
        <p className="v2-pd__desc">{p.description}</p>

        <fieldset className="v2-pd__field" aria-describedby={error ? "v2-size-error" : undefined}>
          <legend>{copy.selectSize}{size && <b>: {sizeLabel(size)}</b>}</legend>
          <div className="v2-sizes">
            {p.sizes.map((s) => (
              <label key={s} className="v2-size">
                <input type="radio" name="size" value={s} checked={size === s} onChange={() => { setSize(s); setError(false); }} className="sr-only" />
                <span>{sizeLabel(s)}</span>
              </label>
            ))}
          </div>
          {error && <p id="v2-size-error" className="v2-field-error" role="alert">{copy.sizeError}</p>}
        </fieldset>

        <div className="v2-pd__field">
          <span className="v2-pd__legend">{ui.qty}</span>
          <div className="v2-qty">
            <button type="button" aria-label={ui.decrease} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><FiMinus aria-hidden="true" /></button>
            <output aria-live="polite">{qty}</output>
            <button type="button" aria-label={ui.increase} disabled={qty >= MAX_QTY} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}><FiPlus aria-hidden="true" /></button>
          </div>
        </div>

        <div className="v2-pd__actions">
          <button type="button" className="v2-pill v2-pill--solid v2-pd__add" onClick={onAdd}><FiShoppingBag aria-hidden="true" /> {labels.add}</button>
          <button type="button" className="v2-pd__wish" aria-pressed={wished} aria-label={`${wished ? labels.unwish : labels.wish}: ${p.name}`} onClick={() => toggleWish(p)}>
            <FiHeart aria-hidden="true" fill={wished ? "currentColor" : "none"} />
          </button>
        </div>

        <ul className="v2-pd__perks">
          {perks.map((t, i) => { const Icon = PERK_ICONS[i]; return <li key={t}><Icon aria-hidden="true" /> {t}</li>; })}
          <li><FiCheck aria-hidden="true" /> {copy.inStock}</li>
        </ul>
      </div>
    </div>
  );
}
