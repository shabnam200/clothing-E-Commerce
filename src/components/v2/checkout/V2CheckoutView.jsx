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
const bnDigitMap = { "0": "\u09E6", "1": "\u09E7", "2": "\u09E8", "3": "\u09E9", "4": "\u09EA", "5": "\u09EB", "6": "\u09EC", "7": "\u09ED", "8": "\u09EE", "9": "\u09EF" };
const localizeDigits = (value) => String(value).replace(/[0-9]/g, (d) => bnDigitMap[d]);
const localizeCopyDigits = (value) => {
  if (typeof value === "string") return localizeDigits(value);
  if (Array.isArray(value)) return value.map(localizeCopyDigits);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeCopyDigits(item)]));
  return value;
};

function Field({ id, label, error, hint, children }) {
  return (
    <div className="v2-field" data-invalid={error ? "true" : undefined}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small className="v2-field__hint">{hint}</small>}
      {error && <small className="v2-field__err" id={`${id}-err`} role="alert"><FiAlertCircle aria-hidden="true" /> {error}</small>}
    </div>
  );
}

export default function V2CheckoutView({ copy: rawCopy, availableCoupons = [] }) {
  const { lines, subtotal, hydrated, fmt, num, fill, sizeLabel, clearCart, settings, lang, user } = useV2Store();
  const copy = lang === "bn" ? localizeCopyDigits(rawCopy) : rawCopy;
  const freeOver = settings.freeDeliveryOver ?? FREE_DELIVERY_OVER;
  const expressFee = settings.expressFee ?? EXPRESS_FEE;
  const districts = settings.districts?.length ? settings.districts : DISTRICTS;
  const accounts = settings.paymentAccounts ?? PAYMENT_ACCOUNTS;
  const standardFee = subtotal === 0 || subtotal >= freeOver ? 0 : (settings.deliveryFee ?? DELIVERY_FEE);
  const [ship, setShip] = useState("standard");
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState(null);
  const [deliveryOptionsLoading, setDeliveryOptionsLoading] = useState(false);
  

  // The server calculates the real delivery fee and total (GET /cart?shipping=...). Until its answer arrives, the local numbers are shown.
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    if (!hydrated || lines.length === 0) return undefined;
    let alive = true;
    api.cart.get({ shipping: ship }).then((c) => { if (alive) setQuote({ ship, subtotal: c.subtotal, delivery: c.delivery }); }).catch(() => {});
    return () => { alive = false; };
  }, [ship, subtotal, hydrated, lines.length]);
  // Only trust the server quote when it really contains a delivery fee (a missing value must not become "Free").
  const serverQuote = quote && quote.ship === ship && quote.subtotal === subtotal && quote.delivery != null ? quote : null;
  const delivery = selectedDeliveryOption && ship === "standard" ? Number(selectedDeliveryOption.charge) : serverQuote ? serverQuote.delivery : ship === "express" ? expressFee : standardFee;

  // Promo code. The server prices the cart and decides the discount (POST /coupons/validate); the order call re-checks the code.
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);        // applied: { code, discount }
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponErr, setCouponErr] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [pointsErr, setPointsErr] = useState("");
  const couponMsg = (ex) => ex?.field?.("coupon") || ex?.message || copy.coupon.error;
  const applyCoupon = async (rawCode = couponInput) => {
    const code = String(rawCode || "").trim();
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
  const pointsBalance = Math.max(0, Math.floor(Number(user?.points) || 0));
  const redemptionEnabled = settings.pointRedemptionEnabled === true;
  const takaPerPoint = Math.max(0, Number(settings.takaPerPoint) || 0);
  const maxPointsDiscountPercent = Math.min(100, Math.max(0, Number(settings.maxPointsDiscountPercent) || 0));
  const pointsDiscountCap = Math.min(subtotal * maxPointsDiscountPercent / 100, Math.max(0, subtotal + delivery - discount));
  const maxPointsForOrder = takaPerPoint > 0 ? Math.min(pointsBalance, Math.floor(pointsDiscountCap / takaPerPoint + 0.000001)) : 0;
  const pointsClaim = Math.min(maxPointsForOrder, Math.max(0, Math.floor(Number(pointsInput) || 0)));
  const pointsDiscount = Math.round(pointsClaim * takaPerPoint * 100) / 100;
  const total = subtotal + delivery - discount - pointsDiscount;

  const [form, setForm] = useState({ name: "", phone: "", email: "", district: "", address: "", note: "", method: "cod", sender: "", trx: "" });
  useEffect(() => {
    let alive = true;
    setSelectedDeliveryOption(null);
    setDeliveryOptions([]);
    if (!form.district) { setDeliveryOptions([]); return undefined; }
    setDeliveryOptionsLoading(true);
    api.delivery.options(form.district).then((rows) => { if (alive) setDeliveryOptions(rows); }).catch(() => { if (alive) setDeliveryOptions([]); }).finally(() => { if (alive) setDeliveryOptionsLoading(false); });
    return () => { alive = false; };
  }, [form.district]);
  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
    }));
  }, [user]);
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
    if (deliveryOptions.length && ship === "standard" && !selectedDeliveryOption) e.deliveryOption = lang === "bn" ? "আপনার এলাকার জন্য ডেলিভারি অপশন বেছে নিন।" : "Choose a delivery option for your area.";
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
      const o = await api.orders.place({ form: { ...form, coupon: coupon?.code, point_claim: pointsClaim, point_discount: pointsDiscount }, shipping: ship, deliveryOptionId: selectedDeliveryOption?.id || null, items: lines.map((l) => ({ productId: l.p.id, size: l.size, color: l.p.color ?? "", qty: l.qty })) });
      await clearCart(); // remove the purchased lines from both the shopper API cart and the visible mini-cart badge
      setOrder({ rid: o.trackingId || o.id, id: `#${o.number}`, total: o.total, method: form.method, methodName, shipName: ship === "express" ? copy.express : copy.standard, address: o.address || `${form.address.trim()}, ${form.district}`, offline: o.paymentStatus === "pending_verification" });
      refreshReferral(); // the first-order referral reward is credited by the server
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (ex) {
      // show server validation errors under the matching inputs
      const fe = {};
      for (const [serverField, formField] of Object.entries(ORDER_FIELD_MAP)) { const m = ex?.field?.(serverField); if (m) fe[formField] = m; }
      const couponProblem = fe.coupon; delete fe.coupon;
      if (couponProblem) { setCoupon(null); setCouponErr(couponProblem); } // the code stopped being valid: show it next to the code box
      if (/point/i.test(ex?.message || "")) setPointsErr(ex.message);
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
        <p className="v2-done__order">{d.order}: <strong>{lang === "bn" ? localizeDigits(order.id) : order.id}</strong></p>
        <div className="v2-done__card">
          {order.offline
            ? <><h2>{d.pendingTitle}</h2><p>{d.pendingText}</p></>
            : <p>{fill(d.codText, { amount: fmt(order.total) })}</p>}
          <dl>
            <div><dt>{d.paid}</dt><dd>{fmt(order.total)}</dd></div>
            <div><dt>{d.method}</dt><dd>{order.methodName}</dd></div>
            <div><dt>{copy.deliveryTitle}</dt><dd>{order.shipName}</dd></div>
            <div><dt>{d.deliverTo}</dt><dd>{lang === "bn" ? localizeDigits(order.address) : order.address}</dd></div>
          </dl>
          <p className="v2-field__hint"><FiTruck aria-hidden="true" /> {d.eta}</p>
        </div>
        <div className="v2-done__acts">
          {settings?.featureToggles?.track_order !== false && order.rid != null && <Link href={ROUTES.order(order.rid)} className="v2-pill v2-pill--solid">{d.track}</Link>}
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
            <legend><span>{num(1)}</span>{copy.contact}</legend>
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
            <legend><span>{num(2)}</span>{copy.deliveryTitle}</legend>
            {deliveryOptionsLoading && <p className="v2-field__hint">{lang === "bn" ? "এলাকার ডেলিভারি অপশন খোঁজা হচ্ছে…" : "Checking delivery options for your area…"}</p>}
            {!!deliveryOptions.length && ship === "standard" && <div className="v2-methods" role="radiogroup" aria-label={lang === "bn" ? "এলাকার ডেলিভারি অপশন" : "Area delivery options"}>
              {deliveryOptions.map((option) => <label key={option.id} className="v2-method" data-checked={Number(selectedDeliveryOption?.id) === Number(option.id) || undefined}>
                <input type="radio" name="delivery-area-option" checked={Number(selectedDeliveryOption?.id) === Number(option.id)} onChange={() => setSelectedDeliveryOption(option)} />
                <span className="v2-method__dot" aria-hidden="true" /><span className="v2-method__txt"><strong>{option.name}</strong><small>{[option.area, option.slot || (option.estimated_days ? `${option.estimated_days} ${lang === "bn" ? "দিন" : "days"}` : "")].filter(Boolean).join(" · ")}</small></span><em className="v2-method__price">{Number(option.charge) === 0 ? copy.free : fmt(option.charge)}</em>
              </label>)}
            </div>}
            {errors.deliveryOption && <small className="v2-field__err" role="alert">{errors.deliveryOption}</small>}
            <div className="v2-methods" role="radiogroup" aria-label={copy.deliveryTitle}>
              {[["standard", copy.standard, copy.standardDesc, standardFee], ["express", copy.express, copy.expressDesc, expressFee]].map(([k, name, desc, fee]) => (
                <label key={k} className="v2-method" data-checked={ship === k || undefined}>
                  <input type="radio" name="ship" value={k} checked={ship === k} onChange={() => { setShip(k); if (k === "express") setSelectedDeliveryOption(null); }} />
                  <span className="v2-method__dot" aria-hidden="true" />
                  <span className="v2-method__txt"><strong>{name}</strong><small>{desc}</small></span>
                  <em className="v2-method__price">{fee === 0 ? copy.free : fmt(fee)}</em>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="v2-co__sec">
            <legend><span>{num(3)}</span>{copy.payment}</legend>
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
                    <div><dt>{copy.sendTo}</dt><dd><strong className="v2-acct__big">{lang === "bn" ? localizeDigits(accounts[form.method].number) : accounts[form.method].number}</strong><CopyButton value={accounts[form.method].number.replace(/-/g, "")} copy={copy} /></dd></div>
                    <div><dt>{copy.accountType}</dt><dd>{accounts[form.method].type}</dd></div>
                    <div><dt>{copy.amount}</dt><dd><strong>{amountText}</strong><CopyButton value={String(total)} copy={copy} /></dd></div>
                  </dl>
                ) : (
                  <dl className="v2-acct">
                    {["bankName", "accName", "accNo", "branch", "routing"].map((k) => (
                      <div key={k}><dt>{copy.bank[k]}</dt><dd>{lang === "bn" ? localizeDigits(accounts.bank[k]) : accounts.bank[k]}{(k === "accNo" || k === "routing") && <CopyButton value={accounts.bank[k].replace(/\./g, "")} copy={copy} />}</dd></div>
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
                <span className="v2-co__iname">{lang === "bn" ? localizeDigits(l.p.name) : l.p.name}<small>{copy.size}: {lang === "bn" && /^\d+$/.test(String(sizeLabel(l.size))) ? localizeDigits(sizeLabel(l.size)) : sizeLabel(l.size)}</small></span>
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
            {!coupon && availableCoupons.length > 0 && (
              <div className="v2-co__offers" aria-label={lang === "bn" ? "\u099A\u09B2\u09A4\u09BF \u0995\u09C1\u09AA\u09A8" : "Available coupons"}>
                <p className="v2-co__offers-title">{lang === "bn" ? "\u099A\u09B2\u09A4\u09BF \u0985\u09AB\u09BE\u09B0" : "Available offers"}</p>
                {availableCoupons.map((offer) => {
                  const discountLabel = offer.discount_type === "percent"
                    ? `${num(offer.discount_value)}% ${lang === "bn" ? "\u099B\u09BE\u09DC" : "off"}`
                    : `${fmt(offer.discount_value)} ${lang === "bn" ? "\u099B\u09BE\u09DC" : "off"}`;
                  return (
                    <article className="v2-co__offer" key={offer.code}>
                      <div className="v2-co__offer-copy">
                        <strong>{offer.code}</strong><span>{discountLabel}</span>
                        {offer.description && <small>{offer.description}</small>}
                        {Number(offer.minimum_amount) > 0 && <small>{lang === "bn" ? "\u09A8\u09BF\u09AE\u09CD\u09A8\u09A4\u09AE \u0985\u09B0\u09CD\u09A1\u09BE\u09B0" : "Min. order"}: {fmt(offer.minimum_amount)}</small>}
                        {offer.discount_type === "percent" && Number(offer.maximum_discount) > 0 && <small>{lang === "bn" ? "\u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A \u099B\u09BE\u09DC" : "Max. savings"}: {fmt(offer.maximum_discount)}</small>}
                        {offer.remaining != null && <small>{lang === "bn" ? "\u09AC\u09BE\u0995\u09BF" : "Left"}: {num(offer.remaining)}</small>}
                        {offer.ends_at && <small>{lang === "bn" ? "\u09B6\u09C7\u09B7 \u09A4\u09BE\u09B0\u09BF\u0996" : "Ends"}: {String(offer.ends_at).slice(0, 10)}</small>}
                      </div>
                      <button type="button" className="v2-textbtn" disabled={couponBusy} onClick={() => { setCouponInput(offer.code); applyCoupon(offer.code); }}>
                        {couponBusy ? copy.coupon.checking : copy.coupon.apply}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          {redemptionEnabled && pointsBalance > 0 && (
            <section className="v2-co__points" aria-label={lang === "bn" ? "\u09AA\u09AF\u09BC\u09C7\u09A8\u09CD\u099F \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0" : "Redeem reward points"}>
              <div className="v2-co__points-head">
                <div><strong>{lang === "bn" ? "\u09B0\u09BF\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u09AA\u09AF\u09BC\u09C7\u09A8\u09CD\u099F" : "Reward points"}</strong><small>{lang === "bn" ? "\u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u09AF\u09CB\u0997\u09CD\u09AF" : "Available"}: {num(pointsBalance)}</small></div>
                <button type="button" className="v2-textbtn" disabled={!maxPointsForOrder} onClick={() => { setPointsInput(String(maxPointsForOrder)); setPointsErr(""); }}>{lang === "bn" ? "\u09B8\u09AC\u099F\u09C1\u0995\u09C1 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0" : "Use maximum"}</button>
              </div>
              <label htmlFor="co-points">{lang === "bn" ? "\u0995\u09A4 \u09AA\u09AF\u09BC\u09C7\u09A8\u09CD\u099F \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09AC\u09C7\u09A8" : "Points to redeem"}</label>
              <input id="co-points" type="number" inputMode="numeric" min="0" max={maxPointsForOrder} step="1" value={pointsInput} aria-invalid={pointsErr ? "true" : undefined}
                onChange={(event) => { setPointsInput(event.target.value); setPointsErr(""); }} />
              <small>{lang === "bn" ? `\u09AA\u09CD\u09B0\u09A4\u09BF \u09AA\u09AF\u09BC\u09C7\u09A8\u09CD\u099F\u09C7 ${fmt(takaPerPoint)} \u099F\u09BE\u0995\u09BE \u099B\u09BE\u09DC; \u098F\u0987 \u0985\u09B0\u09CD\u09A1\u09BE\u09B0\u09C7 \u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A ${num(maxPointsDiscountPercent)}% \u099B\u09BE\u09DC` : `${fmt(takaPerPoint)} off per point. Up to ${num(maxPointsDiscountPercent)}% of the item subtotal can be paid with points.`}</small>
              {pointsClaim > 0 && <small className="v2-co__points-saving">{lang === "bn" ? `${num(pointsClaim)} \u09AA\u09AF\u09BC\u09C7\u09A8\u09CD\u099F\u09C7 ${fmt(pointsDiscount)} \u099B\u09BE\u09DC` : `${num(pointsClaim)} points save ${fmt(pointsDiscount)}`}</small>}
              {pointsErr && <small className="v2-field__err" role="alert">{pointsErr}</small>}
            </section>
          )}
          <dl className="v2-co__totals">
            <div><dt>{copy.subtotal}</dt><dd>{fmt(subtotal)}</dd></div>
            <div><dt>{copy.delivery}</dt><dd>{delivery === 0 ? copy.free : fmt(delivery)}</dd></div>
            {discount > 0 && <div className="v2-co__disc"><dt>{copy.coupon.discount} ({coupon.code})</dt><dd>-{fmt(discount)}</dd></div>}
            {pointsDiscount > 0 && <div className="v2-co__disc"><dt>{lang === "bn" ? "\u09AA\u09AF\u09BC\u09C7\u09A8\u09CD\u099F \u09A1\u09BF\u09B8\u0995\u09BE\u0989\u09A8\u09CD\u099F" : "Points discount"}</dt><dd>-{fmt(pointsDiscount)}</dd></div>}
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
