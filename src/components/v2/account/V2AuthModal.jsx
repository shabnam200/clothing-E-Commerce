"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import V2AuthForm from "@/components/v2/account/V2AuthForm";

// The login / sign-up popup. It is mounted once by V2StoreProvider and opened from anywhere with
//   openAuth("login" | "register" | "prompt")   or   setAuthModalOpen(true)
// "prompt" is the short "sign in to continue" choice shown when a guest taps a feature that needs an account.
export default function V2AuthModal({ copy }) {
  const { authModalOpen, closeAuth, authView, setAuthView } = useV2Store();
  const dialogRef = useRef(null);

  // Escape closes, Tab stays inside the popup, focus returns to the button that opened it.
  useEffect(() => {
    if (!authModalOpen) return;
    const opener = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") { closeAuth(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]")];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); if (opener instanceof HTMLElement) opener.focus?.(); };
  }, [authModalOpen, closeAuth]);

  // Put the cursor in the first field whenever the popup (or its tab) changes.
  useEffect(() => {
    if (!authModalOpen) return;
    const raf = requestAnimationFrame(() => dialogRef.current?.querySelector("input:not([type=checkbox]), .v2-authm__choice")?.focus());
    return () => cancelAnimationFrame(raf);
  }, [authModalOpen, authView]);

  if (!authModalOpen || !copy) return null;

  const view = authView === "register" ? "register" : authView === "login" ? "login" : "prompt";
  const title = view === "register" ? copy.registerTitle : view === "login" ? copy.loginTitle : copy.promptTitle;
  const text = view === "register" ? copy.registerText : view === "login" ? copy.loginText : copy.promptText;

  return (
    <div className="v2-authm" onMouseDown={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div ref={dialogRef} className="v2-authm__dialog" role="dialog" aria-modal="true" aria-labelledby="v2-authm-title" aria-describedby="v2-authm-text">
        <button type="button" className="v2-authm__close" aria-label={copy.close} onClick={closeAuth}><FiX aria-hidden="true" /></button>

        {view !== "prompt" && (
          <div className="v2-authm__tabs" role="tablist" aria-label={`${copy.login} / ${copy.register}`}>
            <button type="button" role="tab" aria-selected={view === "login"} onClick={() => setAuthView("login")}>{copy.login}</button>
            <button type="button" role="tab" aria-selected={view === "register"} onClick={() => setAuthView("register")}>{copy.register}</button>
          </div>
        )}

        <h2 id="v2-authm-title" className="v2-display v2-authm__title">{title}</h2>
        <p id="v2-authm-text" className="v2-authm__text">{text}</p>

        {view === "prompt" ? (
          <div className="v2-authm__choices">
            <button type="button" className="v2-pill v2-pill--solid v2-authm__choice" onClick={() => setAuthView("login")}>{copy.login}</button>
            <button type="button" className="v2-pill v2-pill--outline v2-authm__choice" onClick={() => setAuthView("register")}>{copy.register}</button>
          </div>
        ) : (
          <V2AuthForm key={view} mode={view} copy={copy} onSwitch={setAuthView} />
        )}
      </div>
    </div>
  );
}
