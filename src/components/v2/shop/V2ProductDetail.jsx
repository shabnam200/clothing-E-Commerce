"use client";

import V2SizeHint from "@/components/v2/product/V2SizeHint";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHeart, FiStar, FiTruck, FiRefreshCw, FiShield, FiCheck, FiMinus, FiPlus } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { MAX_QTY, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

const PERK_ICONS = [FiTruck, FiRefreshCw, FiShield];

function Stars({ value }) {
  const full = Math.round(value);
  return (
    <span className="v2-pd__stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => <FiStar key={n} fill={n <= full ? "currentColor" : "none"} />)}
    </span>
  );
}

export default function V2ProductDetail({ p, copy, perks = [] }) {
  const router = useRouter();
  const { addToCart, closeCart, isLoggedIn, toggleWish, isWished, sizeLabel, num, labels, recommendFor } = useV2Store();
  const rec = recommendFor(p);

  const images = p.images?.length ? p.images : [p.image];
  const [active, setActive] = useState(0);
  const [color, setColor] = useState(p.colors?.[0]?.name || "");
  const [size, setSize] = useState(p.sizes?.length === 1 ? p.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("desc");

  // Zoom effect states
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });
  const [isZooming, setIsZooming] = useState(false);
  const imageContainerRef = useRef(null);

  const stock = p.stock ?? 10;
  const out = stock <= 0;
  const low = !out && stock <= 5;
  const maxQty = Math.max(1, Math.min(MAX_QTY, stock));
  const wished = isWished(p.id);
  const specs = copy.specs?.[p.category] || {};
  const reviews = copy.reviewList || [];
  const fill = (s, v) => String(s || "").replace("{n}", v);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const submit = (buyNow) => {
    if (!size) { setError(copy.sizeError); return; }
    setError("");
    addToCart(p, size, color, qty);
    if (buyNow && isLoggedIn) { closeCart(); router.push(ROUTES.checkout); }
  };

  const specRows = [
    [copy.specLabels.material, specs.material],
    [copy.specLabels.fit, specs.fit],
    [copy.specLabels.care, specs.care],
    [copy.specLabels.origin, copy.origin],
    [copy.specLabels.sku, p.sku],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="v2-pd__grid">
        {/* ---------- gallery ---------- */}
        <div className="v2-pd__gallery">
          {images.length > 1 && (
            <div className="v2-pd__thumbs">
              {images.map((src, i) => (
                <button key={src} type="button" className="v2-pd__thumb" aria-current={i === active ? "true" : undefined} aria-label={`${p.name} ${i + 1}`} onClick={() => setActive(i)}>
                  <div className="v2-media"><RemoteImage src={src} alt="" sizes="80px" /></div>
                </button>
              ))}
            </div>
          )}
          <div 
            ref={imageContainerRef}
            className="v2-pd__media"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => { setIsZooming(false); setZoomStyle({ display: 'none' }); }}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}
          >
            {p.discountText && <span className="v2-pd__badge">{p.discountText}</span>}
            <div className="v2-media" style={{ width: '100%', height: '100%' }}>
              <RemoteImage 
                src={images[active]} 
                alt={p.name} 
                sizes="(min-width: 900px) 50vw, 100vw" 
                priority 
                style={{
                  transition: isZooming ? 'transform 0.1s ease-out' : 'transform 0.3s ease',
                  transform: isZooming ? 'scale(2)' : 'scale(1)',
                  ...zoomStyle
                }}
              />
            </div>
          </div>
        </div>

        {/* ---------- info ---------- */}
        <div className="v2-pd__info">
          <Link href={`${ROUTES.shop}?category=${p.category}`} className="v2-eyebrow v2-pd__cat">{p.categoryLabel}</Link>
          <h1 className="v2-display v2-pd__title">{p.name}</h1>

          <div className="v2-pd__rating">
            <Stars value={p.rating} />
            <span>{p.ratingText}</span>
            <span aria-hidden="true">·</span>
            <span>{p.reviewsText} {labels?.reviews || "reviews"}</span>
          </div>

          <div className="v2-pd__priceRow">
            <p className="v2-pd__price">{p.priceText}</p>
            {p.mrpText && <s className="v2-pd__price">{p.mrpText}</s>}
            {p.discountText && <span className="v2-pd__off">{p.discountText} {copy.off}</span>}
          </div>

          <p className="v2-pd__stock" data-level={out ? "out" : low ? "low" : "ok"}>
            <i aria-hidden="true" />
            {out ? copy.outOfStock : low ? fill(copy.lowStock, num(stock)) : copy.inStock}
          </p>

          <p className="v2-pd__desc">{p.description}</p>

          {p.colors?.length > 0 && (
            <div className="v2-pd__field">
              <p className="v2-pd__legend">{copy.color}: <b>{color}</b></p>
              <div className="v2-swatches">
                {p.colors.map((c) => (
                  <button key={c.name} type="button" className="v2-swatch" title={c.name} aria-label={c.name} aria-pressed={color === c.name} style={{ "--sw": c.hex }} onClick={() => setColor(c.name)} />
                ))}
              </div>
            </div>
          )}

          {p.sizes?.length > 0 && (
            <fieldset className="v2-pd__field">
              <legend>{copy.size}{size && <> : <b>{sizeLabel(size)}</b></>}</legend>
              <div className="v2-sizes" role="radiogroup">
                {p.sizes.map((s) => (
                  <label key={s} className={`v2-size${s === rec ? " is-rec" : ""}`}>
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => { setSize(s); setError(""); }} />
                    <span>{sizeLabel(s)}</span>
                  </label>
                ))}
              </div>
              <V2SizeHint product={p} selected={size} onPick={(s) => { setSize(s); setError(""); }} />
              {error && <p className="v2-field-error" role="alert">{error}</p>}
            </fieldset>
          )}

          <div className="v2-pd__field">
            <p className="v2-pd__legend">{copy.qty}</p>
            <div className="v2-qty">
              <button type="button" aria-label="−" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><FiMinus /></button>
              <output aria-live="polite">{num(qty)}</output>
              <button type="button" aria-label="+" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))}><FiPlus /></button>
            </div>
          </div>

          <div className="v2-pd__actions">
            <button type="button" className="v2-pill v2-pill--solid v2-pd__add" disabled={out} onClick={() => submit(false)}>
              {out ? copy.outOfStock : copy.addToCart}
            </button>
            <button type="button" className="v2-pd__wish" aria-pressed={wished} aria-label={wished ? labels?.unwish : labels?.wish} onClick={() => toggleWish(p)}>
              <FiHeart fill={wished ? "currentColor" : "none"} />
            </button>
          </div>
          <button type="button" className="v2-pill v2-pill--outline v2-pd__buy" disabled={out} onClick={() => submit(true)}>{copy.buyNow}</button>

          <ul className="v2-pd__perks">
            {perks.map((t, i) => {
              const Icon = PERK_ICONS[i % PERK_ICONS.length];
              return <li key={t}><Icon aria-hidden="true" />{t}</li>;
            })}
          </ul>
        </div>
      </div>

      {/* ---------- tabs ---------- */}
      <section className="v2-pd__tabs">
        <div className="v2-pd__tabbar" role="tablist">
          {["desc", "details", "reviews"].map((k) => (
            <button key={k} type="button" role="tab" className="v2-pd__tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {copy.tabs[k]}{k === "reviews" ? ` (${p.reviewsText})` : ""}
            </button>
          ))}
        </div>

        <div className="v2-pd__panel" role="tabpanel">
          {tab === "desc" && (
            <>
              <p>{p.description}</p>
              <ul className="v2-pd__hl">
                {copy.highlights.map((h) => <li key={h}><FiCheck aria-hidden="true" /><span>{h}</span></li>)}
              </ul>
            </>
          )}
          {tab === "details" && (
            <dl className="v2-pd__specs">
              {specRows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {tab === "reviews" && (
            reviews.length ? (
              <ul className="v2-rev">
                {reviews.map((r) => (
                  <li key={r.name}>
                    <div className="v2-rev__head"><Stars value={r.rating} /><strong>{r.name}</strong><span className="v2-rev__date">{r.date}</span></div>
                    <p>{r.text}</p>
                  </li>
                ))}
              </ul>
            ) : <p>{copy.noReviews}</p>
          )}
        </div>
      </section>
    </>
  );
}