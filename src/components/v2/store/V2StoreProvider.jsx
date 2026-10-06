"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { FiCheck, FiX } from "react-icons/fi";
import { ROUTES } from "@/config/v2";
import { summarize } from "@/lib/v2/cart";
import { fmtNum, fmtPrice } from "@/lib/v2/format";
import { actions, getServerSnapshot, getSnapshot, lineKey, subscribe } from "@/lib/v2/store";

import V2QuickViewModal from "@/components/v2/product/V2QuickViewModal";

const Ctx = createContext(null);
const noop = () => () => {};

export default function V2StoreProvider({ catalog, lang, ui, labels, children }) {
  const { cart, wish } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [toast, setToast] = useState(null);
  
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const [qvProduct, setQvProduct] = useState(null);
  const openQuickView = useCallback((p) => setQvProduct(p), []);
  const closeQuickView = useCallback(() => setQvProduct(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const fill = (tpl, vars) => Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), tpl);
  const sizeLabel = useCallback((s) => (s === "ONE" ? ui?.oneSize || "One Size" : s), [ui]);

  const { lines, count, subtotal, delivery, total } = useMemo(() => summarize(cart, byId), [cart, byId]);

  // Updated to accept 'color'
  const addToCart = useCallback((p, size, color, qty = 1) => {
    actions.add({ id: p.id, size, color, qty }); // color passed to store
    setToast(null);
    setCartOpen(true);
    setQvProduct(null); 
  }, []);

  // Updated to accept 'color'
  const buyItNow = useCallback((p, size, color, qty = 1) => {
    actions.add({ id: p.id, size, color, qty });
    setQvProduct(null); 
    window.location.href = ROUTES.cart || "/cart"; 
  }, []);

  // Updated quickAdd to grab default color
  const quickAdd = useCallback((p) => {
    const defaultSize = p.sizes?.includes("M") ? "M" : p.sizes?.[1] ?? p.sizes?.[0] ?? "ONE";
    const defaultColor = p.colors?.[0]?.name || "";
    addToCart(p, defaultSize, defaultColor, 1);
  }, [addToCart]);

  const toggleWish = useCallback((p) => {
    const on = wish.includes(p.id);
    actions.toggleWish(p.id);
    setToast({ id: Date.now(), msg: fill(on ? ui.wishRemoved : ui.wishAdded, { name: p.name }), href: on ? null : ROUTES.wishlist, cta: ui.viewWishlist });
  }, [wish, ui, fill]);

  const value = {
    catalog, byId, lang, ui, labels, hydrated, cartOpen, openCart, closeCart, lines, count, subtotal, delivery, total, wish, sizeLabel,
    fmt: (n) => fmtPrice(n, lang), num: (n) => fmtNum(n, lang), fill,
    addToCart, buyItNow, quickAdd, toggleWish, isWished: (id) => wish.includes(id),
    setQty: actions.setQty, removeLine: actions.remove, clearCart: actions.clear,
    openQuickView, closeQuickView
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="v2-toast-zone" role="status" aria-live="polite">
      </div>
      {qvProduct && <V2QuickViewModal p={qvProduct} onClose={closeQuickView} />}
    </Ctx.Provider>
  );
}

export function useV2Store() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useV2Store must be used inside <V2StoreProvider>");
  return v;
}