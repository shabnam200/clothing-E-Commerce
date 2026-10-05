"use client";

import Link from "next/link";
import { FiHeart, FiShoppingBag, FiStar } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

// p = one item from lib/v2/catalog.js. Image + name open the product page; heart and bag are real buttons (wishlist / cart).
export default function V2ProductCard({ p }) {
  const { isWished, toggleWish, quickAdd, labels } = useV2Store();
  const wished = isWished(p.id);
  const href = ROUTES.product(p.id);
  return (
    <article className="v2-pcard">
      <div className="v2-pcard__media v2-zoom">
        <div className="v2-media">
          <RemoteImage src={p.image} alt={p.name} sizes="(min-width: 1200px) 19vw, (min-width: 900px) 24vw, (min-width: 600px) 32vw, 48vw" />
        </div>
        <Link href={href} className="v2-pcard__link" tabIndex={-1} aria-hidden="true" />
        {p.discountText && <span className="v2-pcard__badge">{p.discountText}</span>}
        <button type="button" className="v2-pcard__wish" aria-pressed={wished} aria-label={`${wished ? labels.unwish : labels.wish}: ${p.name}`} onClick={() => toggleWish(p)}>
          <FiHeart aria-hidden="true" fill={wished ? "currentColor" : "none"} />
        </button>
        <div className="v2-pcard__actions">
          <Link href={href} className="v2-pcard__qv" aria-label={`${labels.quick}: ${p.name}`}>{labels.quick}</Link>
          <button type="button" className="v2-pcard__add" aria-label={`${labels.add}: ${p.name}`} onClick={() => quickAdd(p)}>
            <FiShoppingBag aria-hidden="true" /><span>{labels.add}</span>
          </button>
        </div>
      </div>
      <div className="v2-pcard__info">
        <p className="v2-pcard__cat">{p.categoryLabel}</p>
        <h3><Link href={href}>{p.name}</Link></h3>
        <div className="v2-pcard__meta">
          <p className="v2-price"><span>{p.priceText}</span>{p.mrpText && <s>{p.mrpText}</s>}</p>
          <p className="v2-rating" aria-label={`${labels.ratingOf} ${p.ratingText} (${p.reviewsText} ${labels.reviews})`}><FiStar aria-hidden="true" fill="currentColor" /> <span aria-hidden="true">{p.ratingText}</span></p>
        </div>
      </div>
    </article>
  );
}
