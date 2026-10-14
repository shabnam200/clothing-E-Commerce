"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/v2";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

// /login and /register no longer show a full-page form: they open the login popup on the right tab.
// Closing the popup (or signing in) takes the visitor to the home page, so nobody is left on a blank page.
export default function V2AuthRoute({ mode, copy }) {
  const router = useRouter();
  const { hydrated, isLoggedIn, openAuth, authModalOpen } = useV2Store();
  const opened = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (isLoggedIn && !opened.current) { router.replace(ROUTES.account); return; }
    if (!opened.current) { opened.current = true; openAuth(mode); }
  }, [hydrated, isLoggedIn, mode, openAuth, router]);

  // popup closed again (cancelled or logged in) -> leave this route
  useEffect(() => {
    if (opened.current && !authModalOpen) router.replace(isLoggedIn ? ROUTES.shop : ROUTES.home);
  }, [authModalOpen, isLoggedIn, router]);

  return (
    <section className="v2-wrap v2-page v2-page--narrow v2-auth-route" aria-live="polite">
      <h1 className="v2-display v2-h2">{mode === "register" ? copy.registerTitle : copy.loginTitle}</h1>
    </section>
  );
}
