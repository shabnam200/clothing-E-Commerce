"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiArrowLeft, FiCheck, FiCheckCircle, FiCopy, FiLock, FiShoppingBag, FiTruck } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { DELIVERY_FEE, EXPRESS_FEE, FREE_DELIVERY_OVER, PAYMENT_ACCOUNTS, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { completeFirstOrder } from "@/lib/v2/referral";

const DISTRICTS = ["Dhaka", "Gazipur", "Narayanganj", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Cumilla", "Cox's Bazar", "Other"];
const METHODS = ["cod", "bkash", "nagad", "rocket", "bank"];
const MFS = ["bkash", "nagad", "rocket"];
const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;

function CopyButton({ value, copy }) {
  const [done, setDone] = useState(false);
  const onCopy = async () => {
    try { await navigator.clipboard.writeText(value); }
    catch {
      const t = document.createElement("textarea");
      t.value = value; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); } catch {}
      t.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };
  return (
    <button type="button" className="v2-copy" onClick={onCopy} aria-live="polite">
      {done ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      <span>{done ? copy.copied : copy.copy}</span>
    </button>
  );
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className="v2-field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? <p className="v2-field__err" id={`${id}-err`} role="alert"><FiAlertCircle aria-hidden="true" /> {error}</p> : hint ? <p className="v2-field__hint">{hint}</p> : null}
    </div>
  );
}

export default function V2CheckoutView({ copy }) {
  const { lines, count, subtotal, hydrated, fmt, num, fill, sizeLabel, clearCart } = useV2Store();
  const standardFee = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const [ship, setShip] = useState("standard");
  const delivery = ship === "express" ? EXPRESS_FEE : standardFee;
  const total = subtotal + delivery;

  const [form, setForm] = useState({ name: "", phone: "", email: "", district: "", address: "", note: "", method: "cod", sender: "", trx: "" });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);
  const formRef = useRef(null);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const isMfs = MFS.includes(form.method);
  const isBank = form.method === "bank";
  const isOffline = isMfs || isBank;
  const methodName = copy.methods[form.method].name;
  const amountText = fmt(total);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = copy.errors.name;
    if (!PHONE_RE.test(form.phone.replace(/[\s-]/g, ""))) e.phone = copy.errors.phone;
    if (!form.district) e.district = copy.errors.district;
    if (form.address.trim().length < 8) e.address = copy.errors.address;
    if (isMfs && form.sender.replace(/[\s-]/g, "").length < 11) e.sender = copy.errors.sender;
    if (isOffline && form.trx.trim().length < 6) e.trx = copy.errors.trx;
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = formRef.current?.querySelector('[data-invalid="true"] input, [data-invalid="true"] select, [data-invalid="true"] textarea');
      first?.focus();
      return;
    }
    setPlacing(true);
    // Frontend-only: swap this timeout for the real order API call later.
    setTimeout(() => {
      const id = `AV-${Date.now().toString().slice(-6)}`;
      setOrder({ id, total, method: form.method, methodName, shipName: ship === "express" ? copy.express : copy.standard, address: `${form.address.trim()}, ${form.district}`, offline: isOffline });
      clearCart();
      completeFirstOrder(); // referral: credits the invited friend's reward (a server-side step once the backend exists)
      setPlacing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  };

  const accounts = PAYMENT_ACCOUNTS;
  const steps = useMemo(() => copy.steps, [copy.steps]);
  const stepper = (allDone) => (
    <ol className="v2-steps" aria-label={copy.title}>
      {steps.map((st, i) => {
        const state = allDone || i === 0 ? "done" : i === 1 ? "current" : "todo";
        return (
          <li key={st} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span>{state === "done" ? <FiCheck aria-hidden="true" /> : num(i + 1)}</span>{st}
          </li>
        );
      })}
    </ol>
  );

  if (!hydrated) return <p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p>;

  if (order) {
    const d = copy.done;
    return (
      <section className="v2-done" aria-live="polite">
        {stepper(true)}
        <span className="v2-done__icon"><FiCheckCircle aria-hidden="true" /></span>
        <h2 className="v2-display v2-h2">{d.title}</h2>
        <p className="v2-done__order">{d.order}: <strong>{order.id}</strong></p>
        <div className="v2-done__card">
          {order.offline
            ? <><h2>{d.pendingTitle}</h2><p>{d.pendingText}</p></>
            : <p>{fill(d.codText, { amount: fmt(order.total) })}</p>}
          <dl>
            <div><dt>{d.paid}</dt><dd>{fmt(order.total)}</dd></div>
            <div><dt>{d.method}</dt><dd>{order.methodName}</dd></div>
            <div><dt>{copy.deliveryTitle}</dt><dd>{order.shipName}</dd></div>
            <div><dt>{d.deliverTo}</dt><dd>{order.address}</dd></div>
          </dl>
          <p className="v2-field__hint"><FiTruck aria-hidden="true" /> {d.eta}</p>
        </div>
        <p className="v2-field__hint">{d.demo}</p>
        <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{copy.continue}</Link>
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <V2EmptyState icon={<FiShoppingBag />} title={copy.emptyTitle} text={copy.emptyText}>
        <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{copy.continue}</Link>
      </V2EmptyState>
    );
  }

  const showErrors = Object.values(errors).some(Boolean);

  return (
    <>
      <div className="v2-co-head">
        <Link href={ROUTES.cart} className="v2-textbtn"><FiArrowLeft aria-hidden="true" />&nbsp;{copy.back}</Link>
        <p className="v2-co-secure"><FiLock aria-hidden="true" /> {copy.secure}</p>
      </div>

      {stepper(false)}

      <form ref={formRef} className="v2-co" onSubmit={submit} noValidate>
        <div className="v2-co__main">
          {showErrors && <p className="v2-co__alert" role="alert"><FiAlertCircle aria-hidden="true" /> {copy.fixErrors}</p>}

          <fieldset className="v2-co__sec">
            <legend><span>1</span>{copy.contact}</legend>
            <div className="v2-co__grid">
              <Field id="co-name" label={copy.name} error={errors.name}>
                <input id="co-name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "co-name-err" : undefined} />
              </Field>
              <Field id="co-phone" label={copy.phone} error={errors.phone} hint={copy.phoneHint}>
                <input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "co-phone-err" : undefined} />
              </Field>
              <Field id="co-email" label={copy.email}>
                <input id="co-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
              </Field>
              <Field id="co-district" label={copy.district} error={errors.district}>
                <select id="co-district" autoComplete="address-level1" value={form.district} onChange={set("district")} aria-invalid={!!errors.district}>
                  <option value="">{copy.districtPick}</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <div className="v2-co__wide">
                <Field id="co-address" label={copy.address} error={errors.address} hint={copy.addressHint}>
                  <textarea id="co-address" rows={3} autoComplete="street-address" value={form.address} onChange={set("address")} aria-invalid={!!errors.address} aria-describedby={errors.address ? "co-address-err" : undefined} />
                </Field>
              </div>
              <div className="v2-co__wide">
                <Field id="co-note" label={copy.note}>
                  <input id="co-note" value={form.note} onChange={set("note")} />
                </Field>
              </div>
            </div>
          </fieldset>

          <fieldset className="v2-co__sec">
            <legend><span>2</span>{copy.deliveryTitle}</legend>
            <div className="v2-methods" role="radiogroup" aria-label={copy.deliveryTitle}>
              {[["standard", copy.standard, copy.standardDesc, standardFee], ["express", copy.express, copy.expressDesc, EXPRESS_FEE]].map(([k, name, desc, fee]) => (
                <label key={k} className="v2-method" data-checked={ship === k || undefined}>
                  <input type="radio" name="ship" value={k} checked={ship === k} onChange={() => setShip(k)} />
                  <span className="v2-method__dot" aria-hidden="true" />
                  <span className="v2-method__txt"><strong>{name}</strong><small>{desc}</small></span>
                  <em className="v2-method__price">{fee === 0 ? copy.free : fmt(fee)}</em>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="v2-co__sec">
            <legend><span>3</span>{copy.payment}</legend>
            <p className="v2-field__hint">{copy.payHint}</p>
            <div className="v2-methods" role="radiogroup" aria-label={copy.payment}>
              {METHODS.map((m) => (
                <label key={m} className="v2-method" data-checked={form.method === m || undefined}>
                  <input type="radio" name="method" value={m} checked={form.method === m} onChange={set("method")} />
                  <span className="v2-method__dot" aria-hidden="true" />
                  <span className="v2-method__txt">
                    <strong>{copy.methods[m].name}</strong>
                    <small>{copy.methods[m].desc}</small>
                  </span>
                  {m !== "cod" && <em className="v2-method__tag">{copy.offlineTag}</em>}
                </label>
              ))}
            </div>

            {form.method === "cod" && <p className="v2-info"><FiTruck aria-hidden="true" /> {copy.codNote}</p>}

            {isOffline && (
              <div className="v2-offline" role="group" aria-label={fill(copy.howTo, { method: methodName })}>
                <h3>{fill(copy.howTo, { method: methodName })}</h3>

                {isMfs ? (
                  <dl className="v2-acct">
                    <div><dt>{copy.sendTo}</dt><dd><strong className="v2-acct__big">{accounts[form.method].number}</strong><CopyButton value={accounts[form.method].number.replace(/-/g, "")} copy={copy} /></dd></div>
                    <div><dt>{copy.accountType}</dt><dd>{accounts[form.method].type}</dd></div>
                    <div><dt>{copy.amount}</dt><dd><strong>{amountText}</strong><CopyButton value={String(total)} copy={copy} /></dd></div>
                  </dl>
                ) : (
                  <dl className="v2-acct">
                    {["bankName", "accName", "accNo", "branch", "routing"].map((k) => (
                      <div key={k}><dt>{copy.bank[k]}</dt><dd>{accounts.bank[k]}{(k === "accNo" || k === "routing") && <CopyButton value={accounts.bank[k].replace(/\./g, "")} copy={copy} />}</dd></div>
                    ))}
                    <div><dt>{copy.amount}</dt><dd><strong>{amountText}</strong><CopyButton value={String(total)} copy={copy} /></dd></div>
                  </dl>
                )}

                <ol className="v2-ostep">
                  {(isMfs ? copy.mfsSteps : copy.bankSteps).map((s, i) => <li key={i}>{fill(fill(s, { method: methodName }), { amount: amountText })}</li>)}
                </ol>

                <div className="v2-co__grid">
                  {isMfs && (
                    <Field id="co-sender" label={fill(copy.senderNumber, { method: methodName })} error={errors.sender} hint={copy.phoneHint}>
                      <input id="co-sender" type="tel" inputMode="tel" value={form.sender} onChange={set("sender")} aria-invalid={!!errors.sender} aria-describedby={errors.sender ? "co-sender-err" : undefined} />
                    </Field>
                  )}
                  <Field id="co-trx" label={isMfs ? copy.trxId : copy.bankRef} error={errors.trx} hint={copy.trxHint}>
                    <input id="co-trx" autoCapitalize="characters" value={form.trx} onChange={set("trx")} aria-invalid={!!errors.trx} aria-describedby={errors.trx ? "co-trx-err" : undefined} />
                  </Field>
                </div>
                <p className="v2-info">{copy.verifyNote}</p>
              </div>
            )}
          </fieldset>
        </div>

        <aside className="v2-co__side" aria-labelledby="co-sum">
          <h2 id="co-sum" className="v2-display">{copy.summary}</h2>
          <ul className="v2-co__items">
            {lines.map((l) => (
              <li key={l.key}>
                <span className="v2-co__thumb"><span className="v2-media"><RemoteImage src={l.p.image} alt="" sizes="64px" /></span><b>{num(l.qty)}</b></span>
                <span className="v2-co__iname">{l.p.name}<small>{copy.size}: {sizeLabel(l.size)}</small></span>
                <span>{fmt(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="v2-co__totals">
            <div><dt>{copy.subtotal}</dt><dd>{fmt(subtotal)}</dd></div>
            <div><dt>{copy.delivery}</dt><dd>{delivery === 0 ? copy.free : fmt(delivery)}</dd></div>
            <div className="v2-co__grand"><dt>{copy.total}</dt><dd>{fmt(total)}</dd></div>
          </dl>
          <button type="submit" className="v2-pill v2-pill--solid v2-co__cta" disabled={placing}>
            {placing ? copy.placing : form.method === "cod" ? copy.placeCod : copy.place}
          </button>
          <p className="v2-field__hint">{copy.terms}</p>
        </aside>
      </form>
    </>
  );
}
