"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { FiBell, FiTrendingDown } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { acknowledgeDrop, findDrops, useAlerts } from "@/lib/v2/priceAlerts";

// Wishlist > "Price-drop alerts": overview of every saved item. Switching an alert on opens the contact popup
// (V2AlertModal, mounted by the store provider), the same as the bell button on a product card.
export default function V2PriceAlerts({ items, copy: c }) {
  const { isLoggedIn, setAuthModalOpen, toggleAlert, openAlertContact, catalog, fmt, fill, showToast } = useV2Store();
  const { prefs, items: active } = useAlerts();
  const toasted = useRef(new Set()); // one in-app toast per drop

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

  return (
    <section className="v2-alerts" aria-labelledby="v2-alerts-h">
      <div className="v2-alerts__head">
        <h2 id="v2-alerts-h">{c.title}</h2>
        <p>{c.lead}</p>
      </div>

      {!isLoggedIn && (
        <div className="v2-alerts__sum">
          <span>{c.signIn}</span>
          <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>{c.signInCta}</button>
        </div>
      )}

      {isLoggedIn && prefs && (
        <div className="v2-alerts__sum">
          {summary.map((t) => <span key={t}><FiBell aria-hidden="true" />{t}</span>)}
          <button type="button" className="v2-textbtn" onClick={openAlertContact}>{c.edit}</button>
        </div>
      )}

      <ul className="v2-alerts__list">
        {items.map((p) => {
          const a = active[p.id];
          const d = drops[p.id];
          return (
            <li key={p.id} className="v2-alert" data-drop={d ? "true" : undefined}>
              <div className="v2-alert__img"><RemoteImage src={p.image} alt="" sizes="56px" style={{ objectFit: "cover" }} /></div>
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
      <p className="v2-auth__demo">{c.demoNote}</p>
    </section>
  );
}
