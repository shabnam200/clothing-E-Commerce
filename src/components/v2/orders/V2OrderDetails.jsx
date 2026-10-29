"use client";

import Link from "next/link";
import { FiArrowLeft, FiFileText, FiLifeBuoy, FiRefreshCw, FiTruck, FiXCircle } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2OrderGate from "@/components/v2/orders/V2OrderGate";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { ROUTES } from "@/config/v2";
import { buildSteps, canCancel } from "@/lib/v2/orders";

// Full order details: items, price breakdown, receiver, address, payment, status history, return / cancel info.
export default function V2OrderDetails({ id, copy: c, trackCopy: t, returnsCopy: rc }) {
  return (
    <V2OrderGate id={id} copy={t} poll>
      {(o) => <Body o={o} c={c} t={t} rc={rc} />}
    </V2OrderGate>
  );
}

function Body({ o, c, t, rc }) {
  const { fmt, num, fill, lang, user, settings } = useV2Store();
  const loc = lang === "bn" ? "bn-BD" : "en-GB";
  const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? "" : d.toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" }); };
  const fmtDateTime = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? "" : d.toLocaleString(loc, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); };
  const dash = c.none;
  const row = (label, value, cls) => <div key={label}><dt>{label}</dt><dd className={cls}>{value || dash}</dd></div>;

  // history: the server's list, or (older orders) the steps we know were reached
  const history = o.history.length
    ? o.history
    : buildSteps(o).filter((s) => s.state === "done" || s.state === "cancelled").map((s) => ({ status: s.key, at: s.at, note: "" }));
  const rr = o.returnRequest;
  const rcpt = { name: o.receiver.name || user?.name, phone: o.receiver.phone || user?.phone, email: o.receiver.email || user?.email };
  const prepaid = o.paymentMethod !== "cod";

  return (
    <div className="v2-wrap v2-page v2-track">
      <div className="v2-track__top"><Link href={ROUTES.orders} className="v2-textbtn"><FiArrowLeft aria-hidden="true" />&nbsp;{c.back}</Link></div>

      <header className="v2-track__head">
        <div>
          <h2 className="v2-display v2-track__no">#{o.number}</h2>
          <p className="v2-order__meta">{fill(t.placedOn, { date: fmtDate(o.date) })} · {o.itemsCount} {o.itemsCount === 1 ? t.item : t.items}</p>
        </div>
        <span className="v2-status" data-s={o.status}>{t.statuses[o.status] ?? o.status}</span>
      </header>

      <div className="v2-track__acts">
        {settings?.featureToggles?.track_order !== false && <Link href={ROUTES.order(o.id)} className="v2-pill v2-pill--solid"><FiTruck aria-hidden="true" /> {rc.track}</Link>}
        {settings?.featureToggles?.invoice !== false && <Link href={ROUTES.orderInvoice(o.id)} className="v2-pill v2-pill--outline"><FiFileText aria-hidden="true" /> {rc.invoice}</Link>}
        {canCancel(o) && <Link href={ROUTES.orderCancel(o.id)} className="v2-pill v2-pill--outline"><FiXCircle aria-hidden="true" /> {t.cancel}</Link>}
        {o.status === "delivered" && !rr && <Link href={ROUTES.orders} className="v2-pill v2-pill--outline"><FiRefreshCw aria-hidden="true" /> {rc.cta}</Link>}
        <Link href={`${ROUTES.support}?order=${encodeURIComponent(`#${o.number}`)}`} className="v2-textbtn"><FiLifeBuoy aria-hidden="true" />&nbsp;{t.help}</Link>
      </div>

      <div className="v2-track__cols">
        <div className="v2-track__stack">
          <section className="v2-track__card">
            <h3 className="v2-track__h">{c.itemsTitle}</h3>
            {o.items.length === 0 ? <p className="v2-order__meta">{t.noItems}</p> : (
              <ul className="v2-oitems">
                {o.items.map((i, k) => (
                  <li key={`${i.productId}-${i.size}-${i.color}-${k}`}>
                    <span className="v2-media v2-oitems__img">{i.image && <RemoteImage src={i.image} alt="" sizes="72px" />}</span>
                    <div>
                      <p className="v2-oitems__name">{i.name}</p>
                      <p className="v2-order__meta">{[i.size && i.size !== "ONE" ? `${t.size} ${i.size}` : "", i.color, fill(t.qty, { n: num(i.qty) })].filter(Boolean).join(" · ")}</p>
                      <p className="v2-oitems__each">{fill(c.each, { price: fmt(i.unitPrice) })}</p>
                    </div>
                    <p className="v2-oitems__price">{fmt(i.unitPrice * i.qty)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="v2-track__card">
            <h3 className="v2-track__h">{c.historyTitle}</h3>
            {history.length === 0 ? <p className="v2-order__meta">{c.historyEmpty}</p> : (
              <ol className="v2-hist">
                {history.map((h, k) => (
                  <li key={`${h.status}-${k}`}>
                    <strong>{t.steps[h.status]?.t ?? h.status}</strong>
                    {h.at && <time dateTime={h.at}>{fmtDateTime(h.at)}</time>}
                    {h.status === "cancelled" && h.note && <small>{fill(t.cancelReason, { reason: h.note })}</small>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {rr && (
            <section className="v2-track__card">
              <h3 className="v2-track__h">{c.returnTitle}</h3>
              <dl className="v2-track__sum">
                {row(c.returnType, rr.type === "exchange" ? rc.statusExchange : rc.statusReturn)}
                {row(c.returnStatus, c.returnStatuses[rr.status] ?? rr.status)}
                {rr.reason && row(c.returnReason, rr.reason)}
                {rr.note && row(c.returnNote, rr.note)}
              </dl>
            </section>
          )}

          {o.status === "cancelled" && (
            <section className="v2-track__card">
              <h3 className="v2-track__h">{c.cancelTitle}</h3>
              <dl className="v2-track__sum">
                {o.cancelledAt && row(c.cancelledOn, fmtDateTime(o.cancelledAt))}
                {o.cancelReason && row(c.cancelReason, o.cancelReason)}
              </dl>
              <p className="v2-order__meta">{prepaid ? t.refundPrepaid : t.refundCod}</p>
            </section>
          )}
        </div>

        <div className="v2-track__stack">
          <section className="v2-track__card">
            <h3 className="v2-track__h">{t.summaryTitle}</h3>
            <dl className="v2-track__sum">
              <div><dt>{t.subtotal}</dt><dd>{fmt(o.subtotal)}</dd></div>
              <div><dt>{t.delivery}</dt><dd>{o.delivery === 0 ? t.free : fmt(o.delivery)}</dd></div>
              {o.discount > 0 && <div><dt>{t.discount}{o.coupon ? ` (${o.coupon})` : ""}</dt><dd>−{fmt(o.discount)}</dd></div>}
              <div className="v2-track__sum-total"><dt>{t.total}</dt><dd>{fmt(o.total)}</dd></div>
            </dl>
          </section>

          <section className="v2-track__card">
            <h3 className="v2-track__h">{c.infoTitle}</h3>
            <dl className="v2-track__sum">
              {row(c.orderNo, `#${o.number}`)}
              {row(c.placed, fmtDateTime(o.date))}
              {row(c.status, t.statuses[o.status] ?? o.status)}
              {row(c.shipping, t.shippingNames[o.shipping] ?? o.shipping)}
            </dl>
          </section>

          <section className="v2-track__card">
            <h3 className="v2-track__h">{c.receiverTitle}</h3>
            <dl className="v2-track__sum">
              {row(c.name, rcpt.name)}
              {row(c.phone, rcpt.phone)}
              {row(c.email, rcpt.email, "v2-wrapany")}
            </dl>
          </section>

          <section className="v2-track__card">
            <h3 className="v2-track__h">{c.addressTitle}</h3>
            <p className="v2-track__addr">{o.address || dash}</p>
            {o.note && <><h4 className="v2-inv__label">{c.noteTitle}</h4><p className="v2-track__addr">{o.note}</p></>}
          </section>

          <section className="v2-track__card">
            <h3 className="v2-track__h">{c.paymentTitle}</h3>
            <dl className="v2-track__sum">
              {row(c.method, t.methods[o.paymentMethod] ?? o.paymentMethod)}
              {row(c.payStatus, t.paymentStatuses[o.paymentStatus] ?? o.paymentStatus)}
              {prepaid && row(c.senderNumber, o.senderNumber)}
              {prepaid && row(c.trxId, o.trxId, "v2-wrapany")}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
