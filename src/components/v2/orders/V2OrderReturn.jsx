"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiCheckCircle, FiInfo } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import V2OrderGate from "@/components/v2/orders/V2OrderGate";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { RETURN_WINDOW_DAYS, ROUTES } from "@/config/v2";
import { api } from "@/services";
import { returnBlockedReason, returnWindow } from "@/lib/v2/orders";
import "@/styles/v2-orders.css";

const firstError = (e) => (e?.errors ? Object.values(e.errors)[0]?.[0] || e.message : e?.message) || "Something went wrong. Please try again.";

// Return / exchange request page (own page, like cancel). Form labels come from messages `returns`, page texts from `orderReturn`.
export default function V2OrderReturn({ id, copy: c, formCopy: f, trackCopy: t }) {
  return <V2OrderGate id={id} copy={t}>{(o) => <Body o={o} c={c} f={f} t={t} />}</V2OrderGate>;
}

function Body({ o, c, f, t }) {
  const { fmt, num, fill, showToast, settings } = useV2Store();
  const days = settings.returnWindowDays ?? RETURN_WINDOW_DAYS;
  const [draft, setDraft] = useState({ type: "return", reason: "", note: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const id = `#${o.number}`;
  const helpHref = `${ROUTES.support}?order=${encodeURIComponent(id)}`;

  if (sent) {
    return (
      <div className="v2-wrap v2-page">
        <section className="v2-done" aria-live="polite">
          <span className="v2-done__icon"><FiCheckCircle aria-hidden="true" /></span>
          <h2 className="v2-display v2-h2">{c.doneTitle}</h2>
          <p className="v2-done__order">{fill(c.doneText, { id })}</p>
          <div className="v2-done__acts">
            <Link href={ROUTES.orderDetails(o.id)} className="v2-pill v2-pill--solid">{c.viewOrder}</Link>
            <Link href={ROUTES.shop} className="v2-pill v2-pill--outline">{c.continue}</Link>
          </div>
        </section>
      </div>
    );
  }

  const why = returnBlockedReason(o, days);
  if (why) {
    const b = c.blocked[why];
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiInfo />} title={b.title} text={fill(b.text, { id, days: num(days) })}>
          <Link href={ROUTES.orderDetails(o.id)} className="v2-pill v2-pill--solid">{c.viewOrder}</Link>
          <Link href={helpHref} className="v2-pill v2-pill--outline">{c.help}</Link>
        </V2EmptyState>
      </div>
    );
  }

  const win = returnWindow(o, days);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!draft.reason) { setErr(f.errReason); return; }
    setBusy(true);
    try {
      const rr = await api.orders.requestReturn(o.id, draft);
      setSent(rr);
      showToast?.(f.ok, "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) { setErr(firstError(ex)); }
    finally { setBusy(false); }
  };

  return (
    <div className="v2-wrap v2-page v2-track">
      <div className="v2-track__top"><Link href={ROUTES.orderDetails(o.id)} className="v2-textbtn"><FiArrowLeft aria-hidden="true" />&nbsp;{c.backToOrder}</Link></div>
      <h2 className="v2-display v2-track__no">{fill(c.heading, { id })}</h2>
      <p className="v2-lede">{c.lead}</p>

      <div className="v2-track__cols">
        <section className="v2-track__card">
          <h3 className="v2-track__h">{t.itemsTitle}</h3>
          <ul className="v2-oitems">
            {o.items.map((i, k) => (
              <li key={`${i.productId}-${i.size}-${i.color}-${k}`}>
                <span className="v2-media v2-oitems__img">{i.image && <RemoteImage src={i.image} alt="" sizes="72px" />}</span>
                <div>
                  <p className="v2-oitems__name">{i.name}</p>
                  <p className="v2-order__meta">{[i.size && i.size !== "ONE" ? `${t.size} ${i.size}` : "", i.color, fill(t.qty, { n: num(i.qty) })].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="v2-oitems__price">{fmt(i.unitPrice * i.qty)}</p>
              </li>
            ))}
          </ul>
          <p className="v2-track__line"><span>{t.total}</span><span>{fmt(o.total)}</span></p>
        </section>

        <form className="v2-track__card v2-card-form" onSubmit={submit} noValidate aria-label={fill(f.formTitle, { id })}>
          <div className="v2-track__note"><FiInfo aria-hidden="true" /><span>{f.policy}{win && <> {win.left === 1 ? f.dayLeft : fill(f.daysLeft, { n: num(win.left) })}.</>}</span></div>
          {err && <p className="v2-auth__alert" role="alert">{err}</p>}
          <fieldset className="v2-order__types">
            <legend>{f.type}</legend>
            {[["return", f.typeReturn], ["exchange", f.typeExchange]].map(([val, label]) => (
              <label key={val}><input type="radio" name="rt" checked={draft.type === val} onChange={() => setDraft((d) => ({ ...d, type: val }))} /> {label}</label>
            ))}
          </fieldset>
          <div className="v2-field">
            <label htmlFor="rt-reason">{f.reason}</label>
            <select id="rt-reason" value={draft.reason} aria-invalid={!!err && !draft.reason} onChange={(e) => { setDraft((d) => ({ ...d, reason: e.target.value })); setErr(""); }}>
              <option value="">{f.choose}</option>
              {f.reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="v2-field">
            <label htmlFor="rt-note">{f.note}</label>
            <textarea id="rt-note" rows={3} maxLength={400} value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} />
          </div>
          <div className="v2-acc__btns">
            <button type="submit" className="v2-pill v2-pill--solid" disabled={busy}>{busy ? c.working : f.submit}</button>
            <Link href={ROUTES.orderDetails(o.id)} className="v2-pill v2-pill--outline">{f.cancel}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
