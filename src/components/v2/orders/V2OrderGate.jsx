"use client";

import Link from "next/link";
import { FiBox, FiUser } from "react-icons/fi";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import useOrder from "@/components/v2/orders/useOrder";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";
import { ROUTES } from "@/config/v2";
import "@/styles/v2-orders.css";

// Shared wrapper for order pages: handles loading, "sign in", "order not found" and error states,
// then calls children(order). copy = messages orderTrack (it holds those texts).
export default function V2OrderGate({ id, copy: t, poll = false, children }) {
  const { hydrated, isLoggedIn, setAuthModalOpen } = useV2Store();
  const { status, order, message, load } = useOrder(id, { poll });
  const spinner = <div className="v2-wrap v2-page"><p className="v2-loading" role="status"><span className="v2-spinner" aria-hidden="true" /></p></div>;

  if (!hydrated || (isLoggedIn && status === "loading")) return spinner;
  if (!isLoggedIn) {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiUser />} title={t.signInTitle} text={t.signInText}>
          <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthModalOpen(true)}>{t.signIn}</button>
        </V2EmptyState>
      </div>
    );
  }
  if (status === "missing" || status === "error") {
    return (
      <div className="v2-wrap v2-page">
        <V2EmptyState icon={<FiBox />} title={status === "missing" ? t.missingTitle : t.errorTitle} text={status === "missing" ? t.missingText : message}>
          {status === "error" && <button type="button" className="v2-pill v2-pill--solid" onClick={() => load()}>{t.retry}</button>}
          <Link href={ROUTES.orders} className="v2-pill v2-pill--outline">{t.back}</Link>
        </V2EmptyState>
      </div>
    );
  }
  return children(order);
}
