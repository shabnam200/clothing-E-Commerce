"use client";

import { useState } from "react";
import Link from "next/link";
import { FiHeart, FiShoppingBag, FiStar } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2ProductCard({ p }) {
  // openMiniQuickView remove kora hoyeche, quickAdd rakha hoyeche
  const { isWished, toggleWish, labels, openQuickView, quickAdd } = useV2Store();
  const wished = isWished(p.id);
  const href = ROUTES.product(p.id);
  
  const [isHovered, setIsHovered] = useState(false);
  const displayImage = (isHovered && p.hoverImage) ? p.hoverImage : p.image;

  return (
    <article className="v2-pcard" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="v2-pcard__media v2-zoom" style={{ overflow: "hidden", cursor: "zoom-in" }}>
        
        <div className="v2-media" style={{ transition: "transform 0.4s ease", transform: isHovered ? "scale(1.15)" : "scale(1)" }}>
          <RemoteImage src={displayImage} alt={p.name} sizes="(min-width: 1200px) 19vw, (min-width: 900px) 24vw, (min-width: 600px) 32vw, 48vw" />
        </div>
        
        <Link href={href} className="v2-pcard__link" tabIndex={-1} aria-hidden="true" />
        {p.discountText && <span className="v2-pcard__badge">{p.discountText}</span>}
        
        <button type="button" className="v2-pcard__wish" aria-pressed={wished} aria-label={`${wished ? labels.unwish : labels.wish}: ${p.name}`} onClick={() => toggleWish(p)}>
          <FiHeart aria-hidden="true" fill={wished ? "currentColor" : "none"} />
        </button>
        
        <div className="v2-pcard__actions">
          <button type="button" className="v2-pcard__qv" aria-label={`${labels.quick}: ${p.name}`} 
            onClick={(e) => { 
              e.preventDefault(); 
              if (openQuickView) openQuickView(p); 
            }}>
            {labels.quick}
          </button>
          
          {/* Bag icon e click korle ekhon direct add to cart hobe ager moto */}
          <button type="button" className="v2-pcard__add" aria-label={`${labels.add}: ${p.name}`} 
            onClick={(e) => {
              e.preventDefault();
              quickAdd(p);
            }}>
            <FiShoppingBag aria-hidden="true" /><span>{labels.add}</span>
          </button>
        </div>
      </div>

      <div className="v2-pcard__info">
        <p className="v2-pcard__cat">{p.categoryLabel}</p>
        <h3><Link href={href}>{p.name}</Link></h3>
        <div className="v2-pcard__meta">
          <p className="v2-price"><span>{p.priceText}</span>{p.mrpText && <s>{p.mrpText}</s>}</p>
          <p className="v2-rating" aria-label={`${labels.ratingOf} ${p.ratingText} (${p.reviewsText} ${labels.reviews})`}>
            <FiStar aria-hidden="true" fill="currentColor" /> <span aria-hidden="true">{p.ratingText}</span>
          </p>
        </div>
      </div>
    </article>
  );
}