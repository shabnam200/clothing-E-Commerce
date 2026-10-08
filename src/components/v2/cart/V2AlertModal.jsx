"use client";

import { useEffect, useRef, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { disableAlert, savePrefs, useAlerts, validatePrefs } from "@/lib/v2/priceAlerts";

const BLANK = { sms: true, email: false, phone: "", emailAddr: "" };

// Popup shown when a price alert is switched on from a product card (or "Change" on the wishlist page).
// `product` is null when only the contact details are being edited. `fresh` = the alert was just switched on,
// so cancelling without saved contact details switches it off again (an alert with nowhere to send is useless).
export default function V2AlertModal({ product, fresh, copy: c, onClose }) {
  const { fill, showToast } = useV2Store();
  const { prefs } = useAlerts();
  const [draft, setDraft] = useState(() => ({ ...BLANK, ...(prefs || {}) }));
  const [errors, setErrors] = useState({});
  const boxRef = useRef(null);

  const cancel = () => {
    if (fresh && !prefs && product) disableAlert(product.id);
    onClose();
  };
  const cancelRef = useRef(cancel);
  cancelRef.current = cancel;

  useEffect(() => {
    const before = document.activeElement;
    boxRef.current?.querySelector("input")?.focus();
    const onKey = (e) => { if (e.key === "Escape") cancelRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); before?.focus?.(); };
  }, []);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const v = validatePrefs(draft, c);
    setErrors(v.errors);
    if (!v.ok) {
      boxRef.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    savePrefs(v.prefs);
    showToast(product ? fill(c.enabledToast, { name: product.name }) : c.savedToast, "success");
    onClose();
  };

  return (
    <div className="v2-amodal" onClick={cancel}>
      <div className="v2-amodal__box" role="dialog" aria-modal="true" aria-labelledby="v2-amodal-h" ref={boxRef} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="v2-amodal__x" aria-label={c.close} onClick={cancel}><FiX aria-hidden="true" /></button>
        <span className="v2-amodal__icon" aria-hidden="true"><FiBell /></span>
        <h2 id="v2-amodal-h">{c.contactTitle}</h2>
        <p className="v2-amodal__lead">{product ? fill(c.modalLead, { name: product.name }) : c.lead}</p>

        <form className="v2-amodal__form" onSubmit={submit} noValidate>
          {errors.channel && <p className="v2-auth__alert" role="alert">{errors.channel}</p>}
          <fieldset className="v2-alerts__checks">
            <legend className="sr-only">{c.contactTitle}</legend>
            <label><input type="checkbox" checked={draft.sms} onChange={set("sms")} /> {c.sms}</label>
            <label><input type="checkbox" checked={draft.email} onChange={set("email")} /> {c.email}</label>
          </fieldset>
          {draft.sms && (
            <div className="v2-field" data-invalid={errors.phone ? "true" : undefined}>
              <label htmlFor="v2-al-phone">{c.phone}</label>
              <input id="v2-al-phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={set("phone")} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "v2-al-phone-err" : undefined} />
              {errors.phone && <p id="v2-al-phone-err" className="v2-field-error">{errors.phone}</p>}
            </div>
          )}
          {draft.email && (
            <div className="v2-field" data-invalid={errors.email ? "true" : undefined}>
              <label htmlFor="v2-al-email">{c.emailAddr}</label>
              <input id="v2-al-email" type="email" autoComplete="email" value={draft.emailAddr} onChange={set("emailAddr")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "v2-al-email-err" : undefined} />
              {errors.email && <p id="v2-al-email-err" className="v2-field-error">{errors.email}</p>}
            </div>
          )}
          <div className="v2-acc__btns">
            <button type="submit" className="v2-pill v2-pill--solid">{c.save}</button>
            <button type="button" className="v2-pill v2-pill--outline" onClick={cancel}>{c.cancel}</button>
          </div>
        </form>
        <p className="v2-auth__demo">{c.demoNote}</p>
      </div>
    </div>
  );
}
