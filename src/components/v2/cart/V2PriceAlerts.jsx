"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiBell, FiChevronLeft, FiChevronRight, FiTrendingDown } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { acknowledgeDrop, findDrops, useAlerts } from "@/lib/v2/priceAlerts";
import { isSoldOut } from "@/lib/v2/stock";
import { api } from "@/services";

// Wishlist > "Price-drop alerts": overview of every saved item. Switching an alert on opens the contact popup
// (V2AlertModal, mounted by the store provider), the same as the bell button on a product card.
export default function V2PriceAlerts({ items, copy: c }) {
  const { isLoggedIn, setAuthModalOpen, toggleAlert, openAlertContact, catalog, fmt, fill, showToast } = useV2Store();
  const { prefs, items: active } = useAlerts();
  const toasted = useRef(new Set()); // one in-app toast per drop
  const listRef = useRef(null);
  const [backInStock, setBackInStock] = useState([]);
  const [backBusy, setBackBusy] = useState(null);
  const soldOut = items.filter(isSoldOut);

  useEffect(() => {
    if (!isLoggedIn) { setBackInStock([]); return; }
    api.priceAlerts.get().then((result) => setBackInStock(result.backInStock ?? [])).catch(() => {});
  }, [isLoggedIn]);

  const drops = useMemo(() => findDrops(active, catalog), [active, catalog]);

  useEffect(() => {
    for (const [id, d] of Object.entries(drops)) {
      const key = `${id}:${d.to}`;
      if (toasted.current.has(key)) continue;
      toasted.current.add(key);
      const p = catalog.find((x) => String(x.id) === id);
      if (p) showToast(fill(c.toastDrop, { name: p.name, price: fmt(d.to) }), "success");
    }
  }, [drops, catalog, c.toastDrop, fill, fmt, showToast]);

  const summary = [prefs?.sms && fill(c.summarySms, { phone: prefs.phone }), prefs?.email && fill(c.summaryEmail, { email: prefs.emailAddr })].filter(Boolean);
  const scrollAlerts = (direction) => listRef.current?.scrollBy({ left: direction * Math.max(240, listRef.current.clientWidth * 0.8), behavior: "smooth" });

  return (
    <section className="v2-alerts" aria-labelledby="v2-alerts-h">
      <div className="v2-alerts__head">
        <h2 id="v2-alerts-h">{c.title}</h2>
        <div className="v2-alerts__intro">
          <p>{c.lead}</p>
          {!isLoggedIn && (
            <div className="v2-alerts__sum v2-alerts__sum--compact">
              <span>{c.signIn}</span>
              <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>{c.signInCta}</button>
            </div>
          )}
          {isLoggedIn && prefs && (
            <div className="v2-alerts__sum v2-alerts__sum--compact">
              {summary.map((t) => <span key={t}><FiBell aria-hidden="true" />{t}</span>)}
              <button type="button" className="v2-textbtn" onClick={openAlertContact}>{c.edit}</button>
            </div>
          )}
        </div>
      </div>

      <div className="v2-alerts__carousel">
        <div className="v2-alerts__carousel-tools" role="group" aria-label={c.carouselLabel || c.title}>
          <button type="button" onClick={() => scrollAlerts(-1)} aria-label={c.previous || "Previous alerts"}><FiChevronLeft aria-hidden="true" /></button>
          <button type="button" onClick={() => scrollAlerts(1)} aria-label={c.next || "Next alerts"}><FiChevronRight aria-hidden="true" /></button>
        </div>
        <ul className="v2-alerts__list" ref={listRef} tabIndex={0} aria-label={c.carouselLabel || c.title}>
        {items.map((p) => {
          const a = active[p.id];
          const d = drops[p.id];
          return (
            <li key={p.id} className="v2-alert" data-drop={d ? "true" : undefined}>
              <div className="v2-alert__img"><RemoteImage src={p.image} alt="" sizes="44px" style={{ objectFit: "cover" }} /></div>
              <div className="v2-alert__body">
                <Link href={ROUTES.product(p.id)}><strong>{p.name}</strong></Link>
                <span className="v2-alert__price">{p.priceText}</span>
                {d ? (
                  <p className="v2-alert__drop"><FiTrendingDown aria-hidden="true" />{fill(c.dropped, { from: fmt(d.from), to: fmt(d.to) })}</p>
                ) : a ? (
                  <small>{fill(c.watching, { price: fmt(a.basePrice) })}</small>
                ) : null}
              </div>
              <div className="v2-alert__acts">
                {d && <button type="button" className="v2-textbtn" onClick={() => acknowledgeDrop(p.id, p.price)}>{c.gotIt}</button>}
                <button type="button" role="switch" aria-checked={Boolean(a)} aria-label={`${c.toggle}: ${p.name}`} className="v2-switch" onClick={() => toggleAlert(p)}>
                  <i aria-hidden="true" /><span>{c.toggle}</span>
                </button>
              </div>
            </li>
          );
        })}
        </ul>
      </div>
      {soldOut.length > 0 && (
        <section className="v2-alerts__back" aria-labelledby="v2-alerts-back-h">
          <h3 id="v2-alerts-back-h">{c.backTitle}</h3>
          <ul>
            {soldOut.map((product) => {
              const subscribed = backInStock.includes(Number(product.id));
              return (
                <li key={product.id}>
                  <Link href={ROUTES.product(product.id)}>{product.name}</Link>
                  <button type="button" disabled={backBusy === product.id} onClick={async () => {
                    if (!isLoggedIn) { setAuthModalOpen(true); return; }
                    setBackBusy(product.id);
                    try {
                      if (subscribed) {
                        await api.priceAlerts.cancelNotify(product.id);
                        setBackInStock((list) => list.filter((id) => id !== Number(product.id)));
                        showToast(c.backCancelled, "success");
                      } else {
                        await api.priceAlerts.notify(product.id);
                        setBackInStock((list) => [...list, Number(product.id)]);
                        showToast(c.backSaved, "success");
                      }
                    } catch (error) { showToast(error.message, "error"); }
                    finally { setBackBusy(null); }
                  }}>{subscribed ? c.backCancel : c.backNotify}</button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <p className="v2-auth__demo">{c.demoNote}</p>
    </section>
  );
}
