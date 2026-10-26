"use client";

import V2SizeHint from "@/components/v2/product/V2SizeHint";
import V2Reviews from "@/components/v2/shop/V2Reviews";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHeart, FiStar, FiTruck, FiRefreshCw, FiShield, FiCheck, FiMinus, FiPlus } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { V2_CATEGORIES } from "@/data/v2";
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

export default function V2ProductDetail({ p, copy, perks = [], campaignBadge = null }) {
  const router = useRouter();
  const { addToCart, buyItNow, closeCart, isLoggedIn, toggleWish, isWished, sizeLabel, num, labels, recommendFor } = useV2Store();
  const rec = recommendFor(p);

  const images = [...new Set((p.images?.length ? p.images : [p.image]).filter(Boolean))];
  const [active, setActive] = useState(0);
  const imageKey = images.join("|");
  const categoryFallback = V2_CATEGORIES.find((item) => item.key === p.category)?.image || V2_CATEGORIES[0]?.image;
  useEffect(() => { setActive(0); }, [p.id, imageKey]);
  // ---- stock per exact size/colour (a product can be in stock overall but have no stock for the chosen variant) ----
  const vs = p.variantStock || [];
  const hasVariants = vs.length > 0;
  const sameColor = (a, b) => !a || !b || String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  const stockFor = (s, c) => (hasVariants
    ? vs.filter((v) => (!s || !v.size || v.size === s) && sameColor(c, v.color)).reduce((t, v) => t + v.stock, 0)
    : (p.stock ?? 10));
  const firstColor = (p.colors?.find((c) => stockFor("", c.name) > 0) || p.colors?.[0])?.name || "";
  const [color, setColor] = useState(firstColor);
  const [size, setSize] = useState(p.sizes?.length === 1 ? p.sizes[0] : "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("desc");

  // Zoom effect states
  const [zoomStyle, setZoomStyle] = useState({});
  const [isZooming, setIsZooming] = useState(false);
  const imageContainerRef = useRef(null);

  const stock = stockFor(size, color);
  const sizeOut = (s) => hasVariants && stockFor(s, color) <= 0;
  const colorOut = (c) => hasVariants && stockFor(size, c) <= 0;
  const out = stock <= 0;
  const low = !out && stock <= 5;
  const maxQty = Math.max(1, Math.min(MAX_QTY, stock));
  useEffect(() => { setQty((q) => Math.min(q, maxQty)); }, [maxQty]);
  const wished = isWished(p.id);
  const specs = { ...(copy.specs?.[p.category] || {}), ...(p.material && { material: p.material }), ...(p.fit && { fit: p.fit }), ...(p.care && { care: p.care }) };
  const fill = (s, v) => String(s || "").replace("{n}", v);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const submit = (buyNow) => {
    if (!size) { setError(copy.sizeError); return; }
    if (out) { setError(copy.outOfStock); return; }
    setError("");
    if (buyNow) { buyItNow(p, size, qty, color); return; } // straight to checkout, no side cart
    addToCart(p, size, color, qty);
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
                <button key={`${src}-${i}`} type="button" className="v2-pd__thumb" aria-current={i === active ? "true" : undefined} aria-label={`${p.name} ${i + 1}`} onClick={() => setActive(i)}>
                  <div className="v2-media"><RemoteImage src={src} alt="" sizes="80px" /></div>
                </button>
              ))}
            </div>
          )}
          <div 
            ref={imageContainerRef}
            className={`v2-pd__media ${images.length <= 1 ? "v2-pd__media--solo" : ""}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => { setIsZooming(false); setZoomStyle({}); }}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}
          >
            {p.discountText && <span className="v2-pd__badge">{p.discountText}</span>}
            <div className="v2-media" style={{ width: '100%', height: '100%' }}>
              <RemoteImage 
                src={images[active] || images[0]}
                fallbackSrc={categoryFallback}
                unoptimized
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

          {campaignBadge}

          <p className="v2-pd__desc">{p.description}</p>

          {p.colors?.length > 0 && (
            <div className="v2-pd__field">
              <p className="v2-pd__legend">{copy.color}: <b>{color}</b></p>
              <div className="v2-swatches">
                {p.colors.map((c) => (
                  <button key={c.name} type="button" className={`v2-swatch${colorOut(c.name) ? " is-out" : ""}`} title={colorOut(c.name) ? `${c.name} — ${copy.outOfStock}` : c.name} aria-label={colorOut(c.name) ? `${c.name} — ${copy.outOfStock}` : c.name} aria-pressed={color === c.name} style={{ "--sw": c.hex }} onClick={() => { setColor(c.name); if (size && hasVariants && stockFor(size, c.name) <= 0) setSize(""); }} />
                ))}
              </div>
            </div>
          )}

          {p.sizes?.length > 0 && (
            <fieldset className="v2-pd__field">
              <legend>{copy.size}{size && <> : <b>{sizeLabel(size)}</b></>}</legend>
              <div className="v2-sizes" role="radiogroup">
                {p.sizes.map((s) => (
                  <label key={s} className={`v2-size${s === rec ? " is-rec" : ""}${sizeOut(s) ? " is-out" : ""}`} title={sizeOut(s) ? copy.outOfStock : undefined}>
                    <input type="radio" name="size" value={s} checked={size === s} disabled={sizeOut(s)} onChange={() => { setSize(s); setError(""); }} />
                    <span>{sizeLabel(s)}</span>
                  </label>
                ))}
              </div>
              <V2SizeHint product={p} selected={size} onPick={(s) => { if (sizeOut(s)) return; setSize(s); setError(""); }} />
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
          {tab === "reviews" && <V2Reviews productId={p.id} copy={copy} />}
        </div>
      </section>
    </>
  );
}
