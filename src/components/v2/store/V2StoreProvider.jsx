"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { FiCheck, FiX } from "react-icons/fi";
import { ROUTES } from "@/config/v2";
import { summarize } from "@/lib/v2/cart";
import { fmtNum, fmtPrice } from "@/lib/v2/format";
import { actions, getServerSnapshot, getSnapshot, lineKey, subscribe } from "@/lib/v2/store";

const Ctx = createContext(null);
const noop = () => () => {};

// Holds the catalog (language-ready items from lib/v2/catalog.js) and exposes cart + wishlist to every client component.
export default function V2StoreProvider({ catalog, lang, ui, labels, children }) {
  const { cart, wish } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [toast, setToast] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const fill = (tpl, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), tpl);
  const sizeLabel = useCallback((s) => (s === "ONE" ? ui.oneSize : s), [ui.oneSize]);

  const { lines, count, subtotal, delivery, total } = useMemo(() => summarize(cart, byId), [cart, byId]);

  const addToCart = useCallback((p, size, qty = 1) => {
    actions.add({ id: p.id, size, qty });
    setToast(null);
    setCartOpen(true); // the cart panel slides in from the right instead of a toast
  }, []);

  // Card shortcut: picks a sensible default size (M, else the second size, else the only one).
  const quickAdd = useCallback((p) => addToCart(p, p.sizes.includes("M") ? "M" : p.sizes[1] ?? p.sizes[0]), [addToCart]);

  const toggleWish = useCallback((p) => {
    const on = wish.includes(p.id);
    actions.toggleWish(p.id);
    setToast({ id: Date.now(), msg: fill(on ? ui.wishRemoved : ui.wishAdded, { name: p.name }), href: on ? null : ROUTES.wishlist, cta: ui.viewWishlist });
  }, [wish, ui]);

  const value = {
    catalog, byId, lang, ui, labels, hydrated, cartOpen, openCart, closeCart, lines, count, subtotal, delivery, total, wish, sizeLabel,
    fmt: (n) => fmtPrice(n, lang), num: (n) => fmtNum(n, lang), fill,
    addToCart, quickAdd, toggleWish, isWished: (id) => wish.includes(id),
    setQty: actions.setQty, removeLine: actions.remove, clearCart: actions.clear,
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="v2-toast-zone" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="v2-toast">
            <FiCheck aria-hidden="true" className="v2-toast__ok" />
            <p>{toast.msg}</p>
            {toast.href && <Link href={toast.href} className="v2-toast__link" onClick={() => setToast(null)}>{toast.cta}</Link>}
            <button type="button" className="v2-toast__x" aria-label={ui.closeNote} onClick={() => setToast(null)}><FiX aria-hidden="true" /></button>
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useV2Store() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useV2Store must be used inside <V2StoreProvider>");
  return v;
}
