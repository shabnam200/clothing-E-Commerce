"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPrinter } from "react-icons/fi";
import V2OrderGate from "@/components/v2/orders/V2OrderGate";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { BRAND, RETURN_WINDOW_DAYS, ROUTES, SUPPORT } from "@/config/v2";
import { invoiceNo } from "@/lib/v2/orders";
import "@/styles/v2-orders.css";

// Printable invoice. "Print / Save as PDF" opens the browser print dialog; print CSS (globals.css) hides the site header, footer and buttons.
export default function V2OrderInvoice({ id, copy: c, trackCopy: t }) {
  return <V2OrderGate id={id} copy={t}>{(o) => <Doc o={o} c={c} t={t} />}</V2OrderGate>;
}

function Doc({ o, c, t }) {
  const { fmt, num, fill, lang, user, settings } = useV2Store();
  const loc = lang === "bn" ? "bn-BD" : "en-GB";
  const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(+d) ? "" : d.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" }); };
  const sup = settings.support ?? SUPPORT;
  const no = invoiceNo(o);
  const days = settings.returnWindowDays ?? RETURN_WINDOW_DAYS;
  const prepaid = o.paymentMethod !== "cod";
  const to = { name: o.receiver.name || user?.name, phone: o.receiver.phone || user?.phone, email: o.receiver.email || user?.email };

  // a good file name when the customer saves the invoice as PDF
  useEffect(() => {
    const prev = document.title;
    document.title = `${BRAND.name}-${no}`;
    return () => { document.title = prev; };
  }, [no]);

  return (
    <div className="v2-wrap v2-page">
      <div className="v2-inv__bar v2-noprint">
        <Link href={ROUTES.orderDetails(o.id)} className="v2-textbtn"><FiArrowLeft aria-hidden="true" />&nbsp;{c.back}</Link>
        <button type="button" className="v2-pill v2-pill--solid" onClick={() => window.print()}><FiPrinter aria-hidden="true" /> {c.print}</button>
      </div>
      <p className="v2-inv__hint v2-noprint">{c.printHint}</p>

      <article className="v2-inv" aria-label={`${c.title} ${no}`}>
        <header className="v2-inv__head">
          <div>
            <p className="v2-inv__brand">{BRAND.name}</p>
            <p className="v2-inv__from">{[sup.email, sup.phoneLabel ?? sup.phone].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="v2-inv__title">
            <h2>{c.title}</h2>
            {o.status === "cancelled" && <span className="v2-inv__stamp">{c.cancelledStamp}</span>}
          </div>
        </header>

        <dl className="v2-inv__meta">
          <div><dt>{c.invoiceNo}</dt><dd>{no}</dd></div>
          <div><dt>{c.invoiceDate}</dt><dd>{fmtDate(o.date)}</dd></div>
          <div><dt>{c.orderNo}</dt><dd>#{o.number}</dd></div>
          <div><dt>{c.paymentStatus}</dt><dd><span className="v2-inv__chip" data-s={o.paymentStatus}>{t.paymentStatuses[o.paymentStatus] ?? o.paymentStatus}</span></dd></div>
        </dl>

        <div className="v2-inv__parties">
          <div className="v2-inv__party">
            <p className="v2-inv__label">{c.billedTo}</p>
            {to.name && <strong>{to.name}</strong>}
            {to.phone && <span>{to.phone}</span>}
            {to.email && <span>{to.email}</span>}
          </div>
          <div className="v2-inv__party">
            <p className="v2-inv__label">{c.deliveryTo}</p>
            <span>{o.address}</span>
          </div>
        </div>

        {o.items.length === 0 ? <p className="v2-order__meta">{c.noItems}</p> : (
          <div className="v2-inv__scroll">
            <table className="v2-inv__table">
              <thead>
                <tr><th scope="col">{c.item}</th><th scope="col" className="num">{c.unit}</th><th scope="col" className="num">{c.qty}</th><th scope="col" className="num">{c.amount}</th></tr>
              </thead>
              <tbody>
                {o.items.map((i, k) => (
                  <tr key={`${i.productId}-${i.size}-${i.color}-${k}`}>
                    <td>{i.name}<small>{[i.size && i.size !== "ONE" ? `${t.size} ${i.size}` : "", i.color].filter(Boolean).join(" · ")}</small></td>
                    <td className="num">{fmt(i.unitPrice)}</td>
                    <td className="num">{num(i.qty)}</td>
                    <td className="num">{fmt(i.unitPrice * i.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="v2-inv__bottom">
          <dl className="v2-inv__pay">
            <div><dt>{c.method}</dt><dd>{t.methods[o.paymentMethod] ?? o.paymentMethod}</dd></div>
            {prepaid && o.trxId && <div><dt>{c.trxId}</dt><dd>{o.trxId}</dd></div>}
            <div><dt>{t.shipping}</dt><dd>{t.shippingNames[o.shipping] ?? o.shipping}</dd></div>
          </dl>
          <dl className="v2-inv__totals">
            <div><dt>{t.subtotal}</dt><dd>{fmt(o.subtotal)}</dd></div>
            <div><dt>{t.delivery}</dt><dd>{o.delivery === 0 ? t.free : fmt(o.delivery)}</dd></div>
            <div className="grand"><dt>{t.total}</dt><dd>{fmt(o.total)}</dd></div>
          </dl>
        </div>

        <footer className="v2-inv__foot">
          <strong>{c.thanks}</strong>
          <span>{fill(c.terms, { days: num(days) })}</span>
          <span>{c.computer}</span>
        </footer>
      </article>
    </div>
  );
}
