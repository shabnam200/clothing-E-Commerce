"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMinus, FiPlus, FiShoppingBag, FiTrash2, FiTruck, FiX } from "react-icons/fi";
import Image from "next/image";
import confetti from "canvas-confetti";
import { FREE_DELIVERY_OVER, MAX_QTY, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function V2CartDrawer({ copy }) {
  const { ui, lines, count, subtotal, hydrated, cartOpen, closeCart, fmt, num, fill, sizeLabel, setQty, removeLine } = useV2Store();
  const [note, setNote] = useState(false);
  const panel = useRef(null);
  const closeBtn = useRef(null);
  const pathname = usePathname();
  
  // Track previous count for Confetti effect
  const prevCount = useRef(count);

  useEffect(() => { closeCart(); }, [pathname, closeCart]);

  // Confetti effect logic
  useEffect(() => {
    if (cartOpen && count > prevCount.current) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 99999
      });
    }
    prevCount.current = count;
  }, [cartOpen, count]);

  useEffect(() => {
    if (!cartOpen) { setNote(false); return; }
    const opener = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeBtn.current?.focus(), 60);
    const onKey = (e) => {
      if (e.key === "Escape") { closeCart(); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const els = [...panel.current.querySelectorAll(FOCUSABLE)];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [cartOpen, closeCart]);

  const shown = hydrated ? lines : [];
  const left = FREE_DELIVERY_OVER - subtotal;
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_OVER) * 100));

  return (
    <>
      <div className="v2-overlay" data-open={cartOpen || undefined} onClick={closeCart} aria-hidden="true" />
      <aside ref={panel} className="v2-cartdrawer" data-open={cartOpen || undefined} role="dialog" aria-modal="true" aria-labelledby="v2-cartdrawer-title" inert={!cartOpen}>
        <header className="v2-cartdrawer__head">
          <h2 id="v2-cartdrawer-title">{copy.drawerTitle}{shown.length > 0 && <span> ({num(count)})</span>}</h2>
          <button ref={closeBtn} type="button" className="v2-icon-btn" aria-label={copy.close} onClick={closeCart}><FiX aria-hidden="true" /></button>
        </header>

        {shown.length === 0 ? (
          <div className="v2-cartdrawer__empty">
            <span className="v2-empty__icon"><FiShoppingBag aria-hidden="true" /></span>
            <h3 className="v2-display">{copy.emptyTitle}</h3>
            <p>{copy.emptyText}</p>
            <Link href={ROUTES.shop} className="v2-pill v2-pill--solid" onClick={closeCart}>{copy.continue}</Link>
          </div>
        ) : (
          <>
            <div className="v2-cartdrawer__ship">
              <p>{left > 0 ? fill(copy.freeLeft, { amount: fmt(left) }) : copy.freeDone}</p>
              <div className="v2-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <span style={{ width: `${pct}%` }} />
                <FiTruck aria-hidden="true" />
              </div>
            </div>

            <ul className="v2-cartdrawer__list">
              {shown.map((l) => (
                <li key={l.key} className="v2-dline">
                  <Link href={ROUTES.product(l.p.id)} className="v2-dline__img" onClick={closeCart} aria-label={l.p.name}>
                    <span className="v2-media">
                      <Image src={l.p.image} alt={l.p.name} width={88} height={88} style={{ objectFit: 'cover' }} />
                    </span>
                  </Link>
                  <div className="v2-dline__info">
                    <h3><Link href={ROUTES.product(l.p.id)} onClick={closeCart}>{l.p.name}</Link></h3>
                    <p className="v2-dline__meta">{copy.size}: {sizeLabel(l.size)} · {l.p.priceText}</p>
                    <div className="v2-dline__row">
                      <div className="v2-qty" role="group" aria-label={`${ui.qty}: ${l.p.name}`}>
                        <button type="button" aria-label={ui.decrease} disabled={l.qty <= 1} onClick={() => setQty(l.key, l.qty - 1)}><FiMinus aria-hidden="true" /></button>
                        <output aria-live="polite">{num(l.qty)}</output>
                        <button type="button" aria-label={ui.increase} disabled={l.qty >= MAX_QTY} onClick={() => setQty(l.key, l.qty + 1)}><FiPlus aria-hidden="true" /></button>
                      </div>
                      <p className="v2-dline__total">{fmt(l.lineTotal)}</p>
                      <button type="button" className="v2-icon-btn v2-dline__remove" aria-label={`${ui.remove}: ${l.p.name}`} onClick={() => removeLine(l.key)}><FiTrash2 aria-hidden="true" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="v2-cartdrawer__foot">
              <div className="v2-cartdrawer__sub"><span>{copy.subtotal}</span><strong>{fmt(subtotal)}</strong></div>
              <p className="v2-cartdrawer__note">{copy.drawerNote}</p>
              <Link href={ROUTES.cart} className="v2-pill v2-pill--outline" onClick={closeCart}>{copy.viewCart}</Link>
              <button type="button" className="v2-pill v2-pill--solid" onClick={() => setNote(true)}>{copy.checkout}</button>
              {note && <p className="v2-cartdrawer__note" role="status">{copy.checkoutNote}</p>}
              <ul className="v2-cartdrawer__pay" aria-hidden="true">{copy.payments.map((p) => <li key={p}>{p}</li>)}</ul>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}