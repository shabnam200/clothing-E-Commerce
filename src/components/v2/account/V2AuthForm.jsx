"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiCheckCircle } from "react-icons/fi";
import { REFERRAL_REWARD, ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { applyCode, normalizeCode } from "@/lib/v2/referral";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Frontend-only login / register form (validation + error states). No request is sent: connect it to the API later in `submit`.
export default function V2AuthForm({ mode, copy }) {
  const register = mode === "register";
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [applied, setApplied] = useState(false);
  const formRef = useRef(null);
  const { fmt, fill } = useV2Store();

  // /register?ref=AVN-XXXXX (an invite link) pre-fills the referral field.
  useEffect(() => {
    if (!register) return;
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRefCode(normalizeCode(r).slice(0, 12));
  }, [register]);

  const submit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const err = {};
    if (register && !d.name?.toString().trim()) err.name = copy.errors.name;
    if (!EMAIL.test(d.email?.toString().trim() ?? "")) err.email = copy.errors.email;
    if ((d.password?.toString().length ?? 0) < 8) err.password = copy.errors.password;
    if (register && d.confirm !== d.password) err.confirm = copy.errors.confirm;
    if (register && !d.terms) err.terms = copy.errors.terms;
    // Apply the referral code last, so a code is never consumed by a form that still has other errors.
    if (register && refCode.trim() && Object.keys(err).length === 0) {
      const r = applyCode(refCode);
      if (!r.ok) err.referral = r.reason === "own" ? copy.referralOwn : r.reason === "used" ? copy.referralUsed : copy.referralErr;
      else setApplied(true);
    }
    setErrors(err);
    const first = Object.keys(err)[0];
    if (first) { formRef.current?.elements[first]?.focus(); return; }
    setDone(register ? copy.registerOk.replace("{name}", d.name.toString().trim().split(" ")[0]) : copy.loginOk);
  };

  if (done) {
    return (
      <div className="v2-auth v2-auth--done" role="status">
        <FiCheckCircle aria-hidden="true" className="v2-auth__ok" />
        <h2 className="v2-display v2-h2">{done}</h2>
        {applied && <p className="v2-lede">{fill(copy.referralOk, { amount: fmt(REFERRAL_REWARD) })}</p>}
        <p className="v2-lede">{copy.demoNote}</p>
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
        <button type="submit" className="v2-pill v2-pill--solid v2-auth__submit">{register ? copy.register : copy.login}</button>
      </form>
      <p className="v2-auth__switch">{register ? copy.haveAccount : copy.noAccount} <Link href={register ? ROUTES.login : ROUTES.register}>{register ? copy.toLogin : copy.toRegister}</Link></p>
      <p className="v2-auth__demo">{copy.demoNote}</p>
    </div>
  );
}
