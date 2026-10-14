"use client";

import { useEffect, useRef, useState } from "react";
import { REFERRAL_REWARD } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { isValidCode, normalizeCode } from "@/lib/v2/referral";
import { identifierFields, parseIdentifier } from "@/lib/v2/identity";

// The form inside the login / sign-up popup (V2AuthModal).
// The credential is ONE field: an email address or a Bangladeshi mobile number. The same field is used to sign up and to sign in.
// Checks the input in the browser first, then calls the API through the store; server-side errors
// (e.g. "already registered", an invalid referral code) are shown under the right field.
export default function V2AuthForm({ mode, copy, onSwitch }) {
  const register = mode === "register";
  const { fmt, fill, login, register: signUp, showToast } = useV2Store();
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [refOpen, setRefOpen] = useState(false);

  // /register?ref=AVN-XXXXX (an invite link) pre-fills the referral field and keeps it open.
  useEffect(() => {
    if (!register) return;
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) { setRefCode(normalizeCode(r).slice(0, 12)); setRefOpen(true); }
  }, [register]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const raw = String(d.identifier ?? "").trim();
    const password = String(d.password ?? "");
    const err = {};
    if (register && !String(d.name ?? "").trim()) err.name = copy.errors.name;
    if (!parseIdentifier(raw).type) err.identifier = copy.errors.identifier;
    if (password.length < 8) err.password = copy.errors.password;
    if (register && d.confirm !== d.password) err.confirm = copy.errors.confirm;
    if (register && !d.terms) err.terms = copy.errors.terms;
    if (register && refCode.trim() && !isValidCode(refCode)) { err.referral = copy.referralErr; setRefOpen(true); }
    setErrors(err);
    setFormError("");
    const first = Object.keys(err)[0];
    if (first) { formRef.current?.elements[first]?.focus(); return; }

    setBusy(true);
    try {
      if (register) {
        const name = String(d.name).trim();
        // the referral code travels with the sign-up, so it is only used when the account is really created
        await signUp({ name, ...identifierFields(raw), password, passwordConfirmation: String(d.confirm), terms: true, referral: refCode.trim() ? normalizeCode(refCode) : undefined });
        if (refCode.trim()) showToast?.(fill(copy.referralOk, { amount: fmt(REFERRAL_REWARD) }), "success");
      } else {
        await login({ ...identifierFields(raw), password });
      }
      // On success the store closes the popup and shows a toast.
    } catch (ex) {
      // map server field errors onto the form (server field name -> input name)
      const next = {};
      const pick = (...keys) => keys.map((k) => ex?.field?.(k)).find(Boolean);
      const idErr = pick("email", "phone", "login", "identifier");
      if (idErr) next.identifier = idErr;
      const pw = pick("password"); if (pw) next.password = pw;
      const nm = register ? pick("name") : null; if (nm) next.name = nm;
      const cf = register ? pick("password_confirmation") : null; if (cf) next.confirm = cf;
      const tm = register ? pick("terms") : null; if (tm) next.terms = tm;
      if (register && ex?.field?.("referral")) { next.referral = ex.reason === "own_code" ? copy.referralOwn : ex.reason === "already_used" ? copy.referralUsed : copy.referralErr; setRefOpen(true); }
      if (Object.keys(next).length) { setErrors(next); formRef.current?.elements[Object.keys(next)[0]]?.focus(); }
      else setFormError(ex?.message || (register ? copy.registerFailed : copy.signInFailed));
    } finally { setBusy(false); }
  };

  // Plain function (not a component) so typing never remounts the input.
  const field = ({ name, label, type = "text", auto, placeholder, inputMode, toggle }) => {
    const id = `v2-auth-${mode}-${name}`;
    return (
      <div className="v2-field">
        <label htmlFor={id}>{label}</label>
        <div className="v2-field__box">
          <input id={id} name={name} type={type} autoComplete={auto} placeholder={placeholder} inputMode={inputMode} autoCapitalize="none" spellCheck={false}
            aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${id}-err` : undefined} />
          {toggle && (
            <button type="button" className="v2-field__toggle" aria-pressed={showPw} onClick={() => setShowPw((v) => !v)}>{showPw ? copy.hide : copy.show}</button>
          )}
        </div>
        {errors[name] && <p id={`${id}-err`} className="v2-field-error">{errors[name]}</p>}
      </div>
    );
  };

  const pwType = showPw ? "text" : "password";

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="v2-authm__form">
      {formError && <p className="v2-auth__alert" role="alert">{formError}</p>}
      {register && field({ name: "name", label: copy.name, auto: "name" })}
      {field({ name: "identifier", label: copy.identifier, auto: "username", placeholder: copy.identifierPh, inputMode: "email" })}
      {field({ name: "password", label: copy.password, type: pwType, auto: register ? "new-password" : "current-password", toggle: true })}
      {register && field({ name: "confirm", label: copy.confirm, type: pwType, auto: "new-password" })}

      {register && (refOpen ? (
        <div className="v2-field">
          <label htmlFor="v2-auth-register-referral">{copy.referral}</label>
          <div className="v2-field__box">
            <input id="v2-auth-register-referral" name="referral" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} autoComplete="off" autoCapitalize="characters" spellCheck={false}
              aria-invalid={Boolean(errors.referral)} aria-describedby="v2-auth-register-referral-note" />
          </div>
          <p id="v2-auth-register-referral-note" className={errors.referral ? "v2-field-error" : "v2-field-hint"}>{errors.referral || fill(copy.referralHint, { amount: fmt(REFERRAL_REWARD) })}</p>
        </div>
      ) : (
        <button type="button" className="v2-authm__linkbtn" onClick={() => setRefOpen(true)}>{copy.referral}</button>
      ))}

      {register && (
        <div className="v2-field v2-field--check">
          <label className="v2-check">
            <input type="checkbox" name="terms" aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? "v2-auth-register-terms-err" : undefined} />
            <span>{copy.terms}</span>
          </label>
          {errors.terms && <p id="v2-auth-register-terms-err" className="v2-field-error">{errors.terms}</p>}
        </div>
      )}

      <button type="submit" className="v2-pill v2-pill--solid v2-auth__submit" disabled={busy} aria-busy={busy}>
        {busy ? (register ? copy.creating : copy.signingIn) : (register ? copy.register : copy.login)}
      </button>

      <p className="v2-auth__switch">
        {register ? copy.haveAccount : copy.noAccount}{" "}
        <button type="button" className="v2-authm__linkbtn v2-authm__linkbtn--ink" onClick={() => onSwitch?.(register ? "login" : "register")}>{register ? copy.toLogin : copy.toRegister}</button>
      </p>
    </form>
  );
}
