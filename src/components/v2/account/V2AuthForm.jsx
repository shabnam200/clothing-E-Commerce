"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";
import { REFERRAL_REWARD, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { isValidCode, normalizeCode } from "@/lib/v2/referral";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Login / register form. Checks the input in the browser first, then calls the API through the store (login / register);
// server-side errors (e.g. "email already registered", an invalid referral code) are shown under the right field.
export default function V2AuthForm({ mode, copy }) {
  const register = mode === "register";
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [applied, setApplied] = useState(false);
  const formRef = useRef(null);
  const { fmt, fill, login, register: signUp } = useV2Store();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  // /register?ref=AVN-XXXXX (an invite link) pre-fills the referral field.
  useEffect(() => {
    if (!register) return;
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRefCode(normalizeCode(r).slice(0, 12));
  }, [register]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const err = {};
    if (register && !d.name?.toString().trim()) err.name = copy.errors.name;
    if (!EMAIL.test(d.email?.toString().trim() ?? "")) err.email = copy.errors.email;
    if ((d.password?.toString().length ?? 0) < 8) err.password = copy.errors.password;
    if (register && d.confirm !== d.password) err.confirm = copy.errors.confirm;
    if (register && !d.terms) err.terms = copy.errors.terms;
    if (register && refCode.trim() && !isValidCode(refCode)) err.referral = copy.referralErr;
    setErrors(err);
    setFormError("");
    const first = Object.keys(err)[0];
    if (first) { formRef.current?.elements[first]?.focus(); return; }

    setBusy(true);
    try {
      if (register) {
        // the referral code travels with the sign-up, so it is only used when the account is really created
        await signUp({ name: d.name.toString().trim(), email: d.email.toString().trim(), password: d.password.toString(), passwordConfirmation: d.confirm.toString(), terms: true, referral: refCode.trim() ? normalizeCode(refCode) : undefined });
        setApplied(Boolean(refCode.trim()));
        setDone(copy.registerOk.replace("{name}", d.name.toString().trim().split(" ")[0]));
      } else {
        await login({ email: d.email.toString().trim(), password: d.password.toString() });
        setDone(copy.loginOk);
      }
    } catch (ex) {
      // map server field errors onto the form (server names -> input names)
      const map = { password_confirmation: "confirm", referral: "referral", name: "name", email: "email", password: "password", terms: "terms" };
      const next = {};
      for (const [k, input] of Object.entries(map)) { const m = ex?.field?.(k); if (m) next[input] = k === "referral" ? (ex.reason === "own_code" ? copy.referralOwn : ex.reason === "already_used" ? copy.referralUsed : copy.referralErr) : m; }
      if (Object.keys(next).length) { setErrors(next); formRef.current?.elements[Object.keys(next)[0]]?.focus(); }
      else setFormError(ex?.message || copy.fixErrors);
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="v2-auth v2-auth--done" role="status">
        <FiCheckCircle aria-hidden="true" className="v2-auth__ok" />
        <h2 className="v2-display v2-h2">{done}</h2>
        {applied && <p className="v2-lede">{fill(copy.referralOk, { amount: fmt(REFERRAL_REWARD) })}</p>}
        <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{copy.continue}</Link>
      </div>
    );
  }

  const Field = ({ name, label, type = "text", auto, children }) => (
    <div className="v2-field">
      <label htmlFor={`v2-${mode}-${name}`}>{label}</label>
      <div className="v2-field__box">
        <input id={`v2-${mode}-${name}`} name={name} type={type} autoComplete={auto} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `v2-${mode}-${name}-err` : undefined} />
        {children}
      </div>
      {errors[name] && <p id={`v2-${mode}-${name}-err`} className="v2-field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="v2-auth">
      <h2 className="v2-display v2-h2">{register ? copy.registerTitle : copy.loginTitle}</h2>
      <p className="v2-lede v2-auth__lede">{register ? copy.registerText : copy.loginText}</p>
      <form ref={formRef} onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && <p className="v2-auth__alert" role="alert">{copy.fixErrors}</p>}
        {formError && <p className="v2-auth__alert" role="alert">{formError}</p>}
        {register && Field({ name: "name", label: copy.name, auto: "name" })}
        {Field({ name: "email", label: copy.email, type: "email", auto: "email" })}
        {Field({ name: "password", label: copy.password, type: showPw ? "text" : "password", auto: register ? "new-password" : "current-password",
          children: <button type="button" className="v2-field__toggle" aria-pressed={showPw} onClick={() => setShowPw((v) => !v)}>{showPw ? copy.hide : copy.show}</button> })}
        {register && Field({ name: "confirm", label: copy.confirm, type: showPw ? "text" : "password", auto: "new-password" })}
        {register && (
          <div className="v2-field">
            <label htmlFor="v2-register-referral">{copy.referral}</label>
            <div className="v2-field__box">
              <input id="v2-register-referral" name="referral" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-invalid={Boolean(errors.referral)} aria-describedby="v2-register-referral-note" />
            </div>
            <p id="v2-register-referral-note" className={errors.referral ? "v2-field-error" : "v2-field-hint"}>{errors.referral || fill(copy.referralHint, { amount: fmt(REFERRAL_REWARD) })}</p>
          </div>
        )}
        {register && (
          <div className="v2-field v2-field--check">
            <label className="v2-check"><input type="checkbox" name="terms" aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? "v2-register-terms-err" : undefined} /> <span>{copy.terms}</span></label>
            {errors.terms && <p id="v2-register-terms-err" className="v2-field-error">{errors.terms}</p>}
          </div>
        )}
        <button type="submit" className="v2-pill v2-pill--solid v2-auth__submit" disabled={busy} aria-busy={busy}>{register ? copy.register : copy.login}</button>
      </form>
      <p className="v2-auth__switch">{register ? copy.haveAccount : copy.noAccount} <Link href={register ? ROUTES.login : ROUTES.register}>{register ? copy.toLogin : copy.toRegister}</Link></p>
    </div>
  );
}
