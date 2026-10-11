"use client";

import Link from "next/link";
import { FiArrowLeft, FiBox, FiFileText, FiLifeBuoy, FiRefreshCw, FiUser, FiXCircle } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import V2OrderTimeline from "@/components/v2/orders/V2OrderTimeline";
import useOrder from "@/components/v2/orders/useOrder";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { RETURN_WINDOW_DAYS, ROUTES } from "@/config/v2";
import { buildSteps, canCancel, canReturn, estimateWindow } from "@/lib/v2/orders";
import "@/styles/v2-orders.css";

// Order tracking page: status, timeline, estimated delivery, items, totals and the cancel / return / help actions.
export default function V2OrderTracking({ id, copy: c, returnsCopy: rc }) {
  const { hydrated, isLoggedIn, setAuthModalOpen, fmt, num, fill, lang, settings } = useV2Store();
  const { status, order: o, message, load } = useOrder(id, { poll: true });

  const loc = lang === "bn" ? "bn-BD" : "en-GB";
  const fmtDay = (d) => d.toLocaleDateString(loc, { day: "numeric", month: "short" });
  const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? "" : d.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" }); };
  const fmtDateTime = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? "" : d.toLocaleString(loc, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); };

  const back = <Link href={ROUTES.orders} className="v2-textbtn"><FiArrowLeft aria-hidden="true" />&nbsp;{c.back}</Link>;
  const spinner = <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p>;

  if (!hydrated) return <div className="v2-wrap v2-page">{spinner}</div>;
  if (!isLoggedIn) {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiUser />} title={c.signInTitle} text={c.signInText}>
          <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>{c.signIn}</button>
        </V2EmptyState>
      </div>
    );
  }
  if (status === "loading") return <div className="v2-wrap v2-page">{spinner}</div>;
  if (status === "missing" || status === "error") {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiBox />} title={status === "missing" ? c.missingTitle : c.errorTitle} text={status === "missing" ? c.missingText : message}>
          {status === "error" && <button type="button" className="v2-pill v2-pill--solid" onClick={() => load()}>{c.retry}</button>}
          <Link href={ROUTES.orders} className="v2-pill v2-pill--outline">{c.back}</Link>
        </V2EmptyState>
      </div>
    );
  }

  const steps = buildSteps(o);
  const cancelled = o.status === "cancelled";
  const win = !cancelled && o.status !== "delivered" ? estimateWindow(o) : null;
  const etaText = win ? (fmtDay(win.from) === fmtDay(win.to) ? fmtDay(win.to) : `${fmtDay(win.from)} – ${fmtDay(win.to)}`) : "";
  const prepaid = o.paymentMethod !== "cod";
  const showReturn = canReturn(o, settings.returnWindowDays ?? RETURN_WINDOW_DAYS);

  return (
    <div className="v2-wrap v2-page v2-track">
      <div className="v2-track__top">{back}</div>

      <header className="v2-track__head">
        <div>
          <h2 className="v2-display v2-track__no">#{o.number}</h2>
          <p className="v2-order__meta">{fill(c.placedOn, { date: fmtDate(o.date) })} · {o.itemsCount} {o.itemsCount === 1 ? c.item : c.items}</p>
        </div>
        <span className="v2-status" data-s={o.status}>{c.statuses[o.status] ?? o.status}</span>
      </header>

      {win && <p className="v2-track__eta"><strong>{c.eta}</strong> {etaText}</p>}
      {o.status === "delivered" && o.deliveredOn && <p className="v2-track__eta"><strong>{fill(c.deliveredOn, { date: fmtDate(`${o.deliveredOn}T12:00:00`) })}</strong></p>}

      <section className="v2-track__card" aria-label={c.timelineLabel}>
        <V2OrderTimeline steps={steps} copy={c} fmtDateTime={fmtDateTime} />
        {cancelled && (
          <div className="v2-track__cancelled" role="status">
            {o.cancelReason && <p>{fill(c.cancelReason, { reason: o.cancelReason })}</p>}
            <p>{prepaid ? c.refundPrepaid : c.refundCod}</p>
          </div>
        )}
      </section>

      <div className="v2-track__cols">
        <section className="v2-track__card">
          <h3 className="v2-track__h">{c.itemsTitle}</h3>
          {o.items.length === 0 ? <p className="v2-order__meta">{c.noItems}</p> : (
            <ul className="v2-oitems">
              {o.items.map((i, k) => (
                <li key={`${i.productId}-${i.size}-${i.color}-${k}`}>
                  <span className="v2-media v2-oitems__img">{i.image && <RemoteImage src={i.image} alt="" sizes="72px" />}</span>
                  <div>
                    <p className="v2-oitems__name">{i.name}</p>
                    <p className="v2-order__meta">{[i.size && i.size !== "ONE" ? `${c.size} ${i.size}` : "", i.color, fill(c.qty, { n: num(i.qty) })].filter(Boolean).join(" · ")}</p>
                  </div>
                  <p className="v2-oitems__price">{fmt(i.unitPrice * i.qty)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="v2-track__card">
          <h3 className="v2-track__h">{c.summaryTitle}</h3>
          <dl className="v2-track__sum">
            <div><dt>{c.subtotal}</dt><dd>{fmt(o.subtotal)}</dd></div>
            <div><dt>{c.delivery}</dt><dd>{o.delivery === 0 ? c.free : fmt(o.delivery)}</dd></div>
            <div className="v2-track__sum-total"><dt>{c.total}</dt><dd>{fmt(o.total)}</dd></div>
            <div><dt>{c.payment}</dt><dd>{c.methods[o.paymentMethod] ?? o.paymentMethod}</dd></div>
            <div><dt>{c.paymentStatus}</dt><dd>{c.paymentStatuses[o.paymentStatus] ?? o.paymentStatus}</dd></div>
            <div><dt>{c.shipping}</dt><dd>{c.shippingNames[o.shipping] ?? o.shipping}</dd></div>
            {o.address && <div><dt>{c.deliverTo}</dt><dd>{o.address}</dd></div>}
          </dl>
        </section>
      </div>

      <div className="v2-track__acts">
        <Link href={ROUTES.orderDetails(o.id)} className="v2-pill v2-pill--outline">{c.details}</Link>
        {canCancel(o) && <Link href={ROUTES.orderCancel(o.id)} className="v2-pill v2-pill--outline"><FiXCircle aria-hidden="true" /> {c.cancel}</Link>}
        {showReturn && <Link href={ROUTES.orderReturn(o.id)} className="v2-pill v2-pill--solid"><FiRefreshCw aria-hidden="true" /> {rc.cta}</Link>}
        <Link href={ROUTES.orderInvoice(o.id)} className="v2-textbtn"><FiFileText aria-hidden="true" />&nbsp;{c.invoice}</Link>
        <Link href={`${ROUTES.support}?order=${encodeURIComponent(`#${o.number}`)}`} className="v2-textbtn"><FiLifeBuoy aria-hidden="true" />&nbsp;{c.help}</Link>
      </div>
      {canCancel(o) && <p className="v2-order__meta v2-track__hint">{c.cancelHint}</p>}
    </div>
  );
}
