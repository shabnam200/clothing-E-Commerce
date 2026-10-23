"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiArrowLeft, FiCheck, FiCheckCircle, FiCopy, FiLock, FiShoppingBag, FiTag, FiTruck } from "react-icons/fi";
import RemoteImage from "@/components/ui/RemoteImage";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { DELIVERY_FEE, DISTRICTS, EXPRESS_FEE, FREE_DELIVERY_OVER, PAYMENT_ACCOUNTS, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { refreshReferral } from "@/lib/v2/referral";
import { api } from "@/services";
import { ORDER_FIELD_MAP } from "@/services/adapters";

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
  const { lines, subtotal, hydrated, fmt, num, fill, sizeLabel, refreshCart, settings } = useV2Store();
  const freeOver = settings.freeDeliveryOver ?? FREE_DELIVERY_OVER;
  const expressFee = settings.expressFee ?? EXPRESS_FEE;
  const districts = settings.districts?.length ? settings.districts : DISTRICTS;
  const accounts = settings.paymentAccounts ?? PAYMENT_ACCOUNTS;
  const standardFee = subtotal === 0 || subtotal >= freeOver ? 0 : (settings.deliveryFee ?? DELIVERY_FEE);
  const [ship, setShip] = useState("standard");

  // The server calculates the real delivery fee and total (GET /cart?shipping=...). Until its answer arrives, the local numbers are shown.
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    if (!hydrated || lines.length === 0) return undefined;
    let alive = true;
    api.cart.get({ shipping: ship }).then((c) => { if (alive) setQuote({ ship, subtotal: c.subtotal, delivery: c.delivery }); }).catch(() => {});
    return () => { alive = false; };
  }, [ship, subtotal, hydrated, lines.length]);
  const serverQuote = quote && quote.ship === ship && quote.subtotal === subtotal ? quote : null;
  const delivery = serverQuote ? serverQuote.delivery : ship === "express" ? expressFee : standardFee;

  // Promo code. The server prices the cart and decides the discount (POST /coupons/validate); the order call re-checks the code.
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);        // applied: { code, discount }
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponErr, setCouponErr] = useState("");
  const couponMsg = (ex) => ex?.field?.("coupon") || ex?.message || copy.coupon.error;
  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) { setCouponErr(copy.coupon.empty); return; }
    setCouponBusy(true); setCouponErr("");
    try { const c = await api.coupons.validate({ code, shipping: ship, subtotal }); setCoupon({ code: c.code, discount: c.discount }); setCouponInput(""); }
    catch (ex) { setCouponErr(couponMsg(ex)); }
    finally { setCouponBusy(false); }
  };
  const removeCoupon = () => { setCoupon(null); setCouponErr(""); };
  // The discount depends on the delivery option (free-delivery codes) and the cart total: re-check when either changes.
  useEffect(() => {
    if (!coupon) return undefined;
    let alive = true;
    api.coupons.validate({ code: coupon.code, shipping: ship, subtotal })
      .then((c) => { if (alive) setCoupon((cur) => (cur && cur.code === c.code ? { code: c.code, discount: c.discount } : cur)); })
      .catch((ex) => { if (alive) { setCoupon(null); setCouponErr(couponMsg(ex)); } });
    return () => { alive = false; };
  }, [ship, subtotal]); // eslint-disable-line react-hooks/exhaustive-deps
  const discount = coupon ? Math.min(coupon.discount, subtotal + delivery) : 0;
  const total = subtotal + delivery - discount;

  const [form, setForm] = useState({ name: "", phone: "", email: "", district: "", address: "", note: "", method: "cod", sender: "", trx: "" });
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState("");
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

  const submit = async (ev) => {
    ev.preventDefault();
    if (placing) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = formRef.current?.querySelector('[data-invalid="true"] input, [data-invalid="true"] select, [data-invalid="true"] textarea');
      first?.focus();
      return;
    }
    setPlacing(true);
    setSubmitError("");
    try {
      // The server re-checks stock and recalculates prices, delivery and total; the browser only sends what was chosen.
      const o = await api.orders.place({ form: { ...form, coupon: coupon?.code }, shipping: ship, items: lines.map((l) => ({ productId: l.p.id, size: l.size, color: l.p.color ?? "", qty: l.qty })) });
      setOrder({ rid: o.id, id: `#${o.number}`, total: o.total, method: form.method, methodName, shipName: ship === "express" ? copy.express : copy.standard, address: o.address || `${form.address.trim()}, ${form.district}`, offline: o.paymentStatus === "pending_verification" });
      refreshCart();     // the server emptied the cart
      refreshReferral(); // the first-order referral reward is credited by the server
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      // show server validation errors under the matching inputs
      const fe = {};
      for (const [serverField, formField] of Object.entries(ORDER_FIELD_MAP)) { const m = ex?.field?.(serverField); if (m) fe[formField] = m; }
      const couponProblem = fe.coupon; delete fe.coupon;
      if (couponProblem) { setCoupon(null); setCouponErr(couponProblem); } // the code stopped being valid: show it next to the code box
      if (Object.keys(fe).length) {
        setErrors(fe);
        requestAnimationFrame(() => formRef.current?.querySelector('[data-invalid="true"] input, [data-invalid="true"] select, [data-invalid="true"] textarea')?.focus());
      } else if (!couponProblem) setSubmitError(ex?.message || copy.fixErrors);
    } finally { setPlacing(false); }
  };

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
        <div className="v2-done__acts">
          {order.rid != null && <Link href={ROUTES.order(order.rid)} className="v2-pill v2-pill--solid">{d.track}</Link>}
          <Link href={ROUTES.shop} className={order.rid != null ? "v2-pill v2-pill--outline" : "v2-pill v2-pill--solid"}>{copy.continue}</Link>
        </div>
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
          {submitError && <p className="v2-co__alert" role="alert"><FiAlertCircle aria-hidden="true" /> {submitError}</p>}

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
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
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
              {[["standard", copy.standard, copy.standardDesc, standardFee], ["express", copy.express, copy.expressDesc, expressFee]].map(([k, name, desc, fee]) => (
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
          <div className="v2-co__coupon">
            <label htmlFor="co-coupon" className="v2-co__coupon-label">{copy.coupon.title}</label>
            {coupon ? (
              <p className="v2-co__coupon-on" role="status">
                <FiTag aria-hidden="true" /> <span>{fill(copy.coupon.applied, { code: coupon.code, amount: fmt(coupon.discount) })}</span>
                <button type="button" className="v2-textbtn" onClick={removeCoupon}>{copy.coupon.remove}</button>
              </p>
            ) : (
              <div className="v2-co__coupon-row">
                <input id="co-coupon" value={couponInput} placeholder={copy.coupon.placeholder} autoCapitalize="characters" autoComplete="off" spellCheck={false}
                  aria-invalid={couponErr ? "true" : undefined} aria-describedby={couponErr ? "co-coupon-err" : undefined}
                  onChange={(e) => { setCouponInput(e.target.value); if (couponErr) setCouponErr(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }} /> {/* Enter applies the code; it must not place the order */}
                <button type="button" className="v2-pill v2-pill--outline" onClick={applyCoupon} disabled={couponBusy}>{couponBusy ? copy.coupon.checking : copy.coupon.apply}</button>
              </div>
            )}
            {couponErr && <p className="v2-field__err" id="co-coupon-err" role="alert"><FiAlertCircle aria-hidden="true" /> {couponErr}</p>}
          </div>
          <dl className="v2-co__totals">
            <div><dt>{copy.subtotal}</dt><dd>{fmt(subtotal)}</dd></div>
            <div><dt>{copy.delivery}</dt><dd>{delivery === 0 ? copy.free : fmt(delivery)}</dd></div>
            {discount > 0 && <div className="v2-co__disc"><dt>{copy.coupon.discount} ({coupon.code})</dt><dd>−{fmt(discount)}</dd></div>}
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
