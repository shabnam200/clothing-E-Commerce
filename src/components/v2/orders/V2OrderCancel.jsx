"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiBox, FiCheckCircle, FiInfo, FiUser } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import useOrder from "@/components/v2/orders/useOrder";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { ROUTES } from "@/config/v2";
import { api } from "@/services";
import { canCancel, cancelBlockedReason } from "@/lib/v2/orders";

const firstError = (e) => (e?.errors ? Object.values(e.errors)[0]?.[0] || e.message : e?.message) || "Something went wrong. Please try again.";

// Cancel order page: summary, reason, optional note, confirmation. Only orders that have not shipped can be cancelled.
export default function V2OrderCancel({ id, copy: c, trackCopy: t }) {
  const { hydrated, isLoggedIn, setAuthModalOpen, fmt, num, fill, showToast, refreshCart, settings } = useV2Store();
  const { status, order: o, message, load, setOrder } = useOrder(id);
  const [draft, setDraft] = useState({ reason: "", note: "", confirm: false });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // the cancelled order, once the server accepted it

  const spinner = <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p>;
  const back = (href, label) => <Link href={href} className="v2-textbtn"><FiArrowLeft aria-hidden="true" />&nbsp;{label}</Link>;

  if (!hydrated) return <div className="v2-wrap v2-page">{spinner}</div>;
  if (!isLoggedIn) {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiUser />} title={t.signInTitle} text={t.signInText}>
          <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>{t.signIn}</button>
        </V2EmptyState>
      </div>
    );
  }
  if (status === "loading") return <div className="v2-wrap v2-page">{spinner}</div>;
  if (status === "missing" || status === "error") {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiBox />} title={status === "missing" ? t.missingTitle : t.errorTitle} text={status === "missing" ? t.missingText : message}>
          {status === "error" && <button type="button" className="v2-pill v2-pill--solid" onClick={() => load()}>{t.retry}</button>}
          <Link href={ROUTES.orders} className="v2-pill v2-pill--outline">{t.back}</Link>
        </V2EmptyState>
      </div>
    );
  }

  const prepaid = o.paymentMethod !== "cod";
  const refundText = prepaid ? fill(c.refundPrepaid, { amount: fmt(o.total), method: t.methods[o.paymentMethod] ?? o.paymentMethod }) : c.refundCod;

  // ---- success
  if (done) {
    return (
      <div className="v2-wrap v2-page">
        <section className="v2-done" aria-live="polite">
          <span className="v2-done__icon"><FiCheckCircle aria-hidden="true" /></span>
          <h2 className="v2-display v2-h2">{c.doneTitle}</h2>
          <p className="v2-done__order">{fill(c.doneText, { id: `#${done.number}` })}</p>
          <div className="v2-done__card"><p>{refundText}</p></div>
          <div className="v2-done__acts">
            <Link href={(settings?.featureToggles?.track_order === false ? ROUTES.account : ROUTES.order(done.id))} className="v2-pill v2-pill--solid">{c.viewOrder}</Link>
            <Link href={ROUTES.shop} className="v2-pill v2-pill--outline">{c.continue}</Link>
          </div>
        </section>
      </div>
    );
  }

  // ---- not cancellable (already shipped / delivered / cancelled / return requested)
  if (!canCancel(o)) {
    const why = c.blocked[cancelBlockedReason(o) ?? "shipped"];
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiInfo />} title={why.title} text={fill(why.text, { id: `#${o.number}` })}>
          <Link href={(settings?.featureToggles?.track_order === false ? ROUTES.account : ROUTES.order(o.id))} className="v2-pill v2-pill--solid">{c.viewOrder}</Link>
          <Link href={`${ROUTES.support}?order=${encodeURIComponent(`#${o.number}`)}`} className="v2-pill v2-pill--outline">{t.help}</Link>
        </V2EmptyState>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const next = {};
    if (!draft.reason) next.reason = c.errReason;
    if (!draft.confirm) next.confirm = c.errConfirm;
    setErr(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const updated = await api.orders.cancel(o.id, { reason: draft.reason, note: draft.note });
      setOrder(updated);
      setDone(updated);
      await refreshCart();
      showToast?.(c.doneToast, "success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      const msg = firstError(ex);
      setErr({ form: msg });
      if (ex?.status === 422 && ex?.errors?.order) await load(true); // the order moved on (e.g. just shipped): show the up-to-date state
    } finally { setBusy(false); }
  };

  return (
    <div className="v2-wrap v2-page v2-track">
      <div className="v2-track__top">{back((settings?.featureToggles?.track_order === false ? ROUTES.account : ROUTES.order(o.id)), c.backToOrder)}</div>
      <h2 className="v2-display v2-track__no">{fill(c.heading, { id: `#${o.number}` })}</h2>
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
          <p className="v2-track__sum-total v2-track__line"><span>{t.total}</span><strong>{fmt(o.total)}</strong></p>
        </section>

        <form className="v2-track__card v2-card-form" onSubmit={submit} noValidate aria-label={c.heading.replace("{id}", `#${o.number}`)}>
          <p className="v2-order__policy">{c.policy}</p>
          <p className="v2-order__policy"><strong>{prepaid ? c.refundTitle : c.noChargeTitle}</strong> {refundText}</p>
          {err.form && <p className="v2-auth__alert" role="alert">{err.form}</p>}
          <div className="v2-field">
            <label htmlFor="co-reason">{c.reasonLabel}</label>
            <select id="co-reason" value={draft.reason} aria-invalid={!!err.reason} onChange={(e) => { setDraft((d) => ({ ...d, reason: e.target.value })); setErr((x) => ({ ...x, reason: "" })); }}>
              <option value="">{c.choose}</option>
              {c.reasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {err.reason && <p className="v2-field-error" role="alert">{err.reason}</p>}
          </div>
          <div className="v2-field">
            <label htmlFor="co-note">{c.noteLabel}</label>
            <textarea id="co-note" rows={3} maxLength={400} value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} />
          </div>
          <label className="v2-track__check">
            <input type="checkbox" checked={draft.confirm} onChange={(e) => { setDraft((d) => ({ ...d, confirm: e.target.checked })); setErr((x) => ({ ...x, confirm: "" })); }} />
            <span>{c.confirm}</span>
          </label>
          {err.confirm && <p className="v2-field-error" role="alert">{err.confirm}</p>}
          <div className="v2-acc__btns">
            <button type="submit" className="v2-pill v2-pill--solid v2-pill--danger" disabled={busy}>{busy ? c.working : c.submit}</button>
            <Link href={(settings?.featureToggles?.track_order === false ? ROUTES.account : ROUTES.order(o.id))} className="v2-pill v2-pill--outline">{c.keep}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
