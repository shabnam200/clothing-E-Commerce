"use client";

import Link from "next/link";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { FREE_DELIVERY_OVER, MAX_QTY, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2CartView({ copy }) {
  const { ui, lines, count, subtotal, delivery, total, hydrated, fmt, num, fill, sizeLabel, setQty, removeLine, clearCart } = useV2Store();

  if (!hydrated) return <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /> {copy.loading}</p>;
  if (lines.length === 0) {
    return (
      <V2EmptyState icon={<FiShoppingBag />} title={copy.emptyTitle} text={copy.emptyText}>
        <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{copy.continue}</Link>
      </V2EmptyState>
    );
  }
  const left = FREE_DELIVERY_OVER - subtotal;
  return (
    <div className="v2-cart">
      <div>
        <p className="v2-cart__count">{count === 1 ? copy.itemOne : fill(copy.items, { n: num(count) })}</p>
        <ul className="v2-cart__list">
          {lines.map((l) => (
            <li key={l.key} className="v2-line">
              <Link href={ROUTES.product(l.p.id)} className="v2-line__img" aria-label={l.p.name}>
                <span className="v2-media"><RemoteImage src={l.p.image} alt="" sizes="110px" /></span>
              </Link>
              <div className="v2-line__info">
                <p className="v2-pcard__cat">{l.p.categoryLabel}</p>
                <h3><Link href={ROUTES.product(l.p.id)}>{l.p.name}</Link></h3>
                <p className="v2-line__meta">{copy.size}: {sizeLabel(l.size)} · {l.p.priceText} {copy.each}</p>
              </div>
              <div className="v2-qty" role="group" aria-label={`${ui.qty}: ${l.p.name}`}>
                <button type="button" aria-label={ui.decrease} disabled={l.qty <= 1} onClick={() => setQty(l.key, l.qty - 1)}><FiMinus aria-hidden="true" /></button>
                <output aria-live="polite">{num(l.qty)}</output>
                <button type="button" aria-label={ui.increase} disabled={l.qty >= MAX_QTY} onClick={() => setQty(l.key, l.qty + 1)}><FiPlus aria-hidden="true" /></button>
              </div>
              <p className="v2-line__total">{fmt(l.lineTotal)}</p>
              <button type="button" className="v2-line__remove" aria-label={`${ui.remove}: ${l.p.name}`} onClick={() => removeLine(l.key)}><FiTrash2 aria-hidden="true" /><span>{ui.remove}</span></button>
            </li>
          ))}
        </ul>
        <button type="button" className="v2-textbtn" onClick={clearCart}>{copy.clear}</button>
      </div>

      <aside className="v2-summary" aria-labelledby="v2-summary-title">
        <h2 id="v2-summary-title" className="v2-display">{copy.summary}</h2>
        <dl>
          <div><dt>{copy.subtotal}</dt><dd>{fmt(subtotal)}</dd></div>
          <div><dt>{copy.delivery}</dt><dd>{delivery === 0 ? copy.free : fmt(delivery)}</dd></div>
          <div className="v2-summary__total"><dt>{copy.total}</dt><dd>{fmt(total)}</dd></div>
        </dl>
        <p className="v2-summary__free">{left > 0 ? fill(copy.freeLeft, { amount: fmt(left) }) : copy.freeDone}</p>
        <Link href={ROUTES.checkout} className="v2-pill v2-pill--solid v2-summary__cta">{copy.checkout}</Link>
        <Link href={ROUTES.shop} className="v2-textbtn">{copy.continue}</Link>
      </aside>
    </div>
  );
}
