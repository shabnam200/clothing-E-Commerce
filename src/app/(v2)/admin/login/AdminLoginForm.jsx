"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function AdminLoginForm({ copy }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      if (!response.ok) {
        setMessage(response.status === 503 ? copy.adminLoginUnavailable : response.status === 403 ? copy.adminLoginDenied : copy.signInFailed);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setMessage(copy.signInFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="v2-wrap v2-page v2-admin-login">
      <div className="v2-authm__dialog v2-admin-login__card">
        <h1 className="v2-display v2-authm__title">{copy.adminLoginTitle}</h1>
        <p className="v2-authm__text">{copy.adminLoginText}</p>
        <form onSubmit={submit} className="v2-authm__form">
          <div className="v2-field">
            <label htmlFor="admin-phone">{copy.adminLoginPhone}</label>
            <div className="v2-field__box">
              <input id="admin-phone" name="phone" type="tel" inputMode="tel" autoComplete="username" placeholder={copy.adminLoginPhonePh} required value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
          </div>
          <div className="v2-field">
            <label htmlFor="admin-password">{copy.password}</label>
            <div className="v2-field__box">
              <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              <button type="button" className="v2-field__toggle" aria-label={showPassword ? copy.hide : copy.show} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
              </button>
            </div>
          </div>
          {message && <p className="v2-auth__alert" role="alert">{message}</p>}
          <button type="submit" className="v2-pill v2-pill--solid v2-auth__submit" disabled={busy} aria-busy={busy}>
            {busy ? copy.signingIn : copy.login}
          </button>
        </form>
      </div>
    </section>
  );
}
