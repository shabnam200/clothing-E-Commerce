"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi"; 
import { MAX_QTY, FREE_DELIVERY_OVER, DELIVERY_FEE } from "@/config/v2"; 
import V2QuickNav from "@/components/v2/layout/V2QuickNav";
import V2QuickViewModal from "@/components/v2/product/V2QuickViewModal";
import { buildCatalog } from "@/lib/v2/catalog"; 
import { EMPTY_PASSPORT, cleanPassport, recommendSize } from "@/lib/v2/size";
import { disableAlert, dropAlertLocal, enableAlert, getAlerts, loadAlerts, resetAlerts } from "@/lib/v2/priceAlerts";
import { resetReferral } from "@/lib/v2/referral";
import V2AlertModal from "@/components/v2/cart/V2AlertModal";
import V2AuthModal from "@/components/v2/account/V2AuthModal";
import { api, registerCatalog, tokenStore } from "@/services";

const Ctx = createContext(null);

const keyOf = (c) => `${c.id}-${c.size}-${c.color}`;

function sanitizeData(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeData);
  const result = {};
  for (const key in obj) {
    if (typeof obj[key] !== 'function') {
      result[key] = sanitizeData(obj[key]);
    } else {
      result[key] = "";
    }
  }
  return result;
}

// Client state for the whole storefront. The SERVER (api.*, see services/) is the source of truth for the cart, wishlist,
// price alerts, size passport and the login session; this provider keeps a copy so the screen reacts instantly.
//   catalog  : products, loaded on the server (lib/v2/catalogSource.js) and passed in
//   settings : delivery fees, limits, payment accounts (lib/v2/settings.js)
export default function V2StoreProvider({ children, v2, lang, catalog: catalogProp, settings: settingsProp }) {
  const safeV2 = useMemo(() => sanitizeData(v2), [v2]);
  
  const catalog = useMemo(() => {
    if (Array.isArray(catalogProp)) return catalogProp;
    try {
      return buildCatalog(safeV2, lang) || [];
    } catch (err) {
      return [];
    }
  }, [catalogProp, safeV2, lang]);

  const settings = useMemo(() => settingsProp || {}, [settingsProp]);
  const maxQty = settings.maxQtyPerLine ?? MAX_QTY;
  const freeOver = settings.freeDeliveryOver ?? FREE_DELIVERY_OVER;
  const deliveryFee = settings.deliveryFee ?? DELIVERY_FEE;

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [sizeProfile, setSizeProfile] = useState(EMPTY_PASSPORT);

  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const [alertModal, setAlertModal] = useState(null); // { product, fresh } while the price-alert contact popup is open
  const alertsCopy = safeV2?.wishlist?.alerts;
  const closeAlertModal = useCallback(() => setAlertModal(null), []);
  const openAlertContact = useCallback(() => setAlertModal({ product: null, fresh: false }), []);

  const [qvProduct, setQvProduct] = useState(null);
  const openQuickView = useCallback((product) => setQvProduct(product), []);
  const closeQuickView = useCallback(() => setQvProduct(null), []);

  const [user, setUser] = useState(null);           // the logged-in customer (null = guest)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState("prompt"); 

  const [miniCartDismissed, setMiniCartDismissed] = useState(false);
  const prevCount = useRef(0);

  // Refs hold the latest values for callbacks that must not go stale (async work, "resume after login").
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;
  const userRef = useRef(null);
  const resumeRef = useRef(null);      // what the person was doing when we asked them to log in
  const restoringRef = useRef(true);   // true while the saved session is being checked on first load
  const queueRef = useRef(Promise.resolve());

  const isLoggedIn = Boolean(user);
  const setSession = useCallback((u) => { userRef.current = u; setUser(u); }, []);

  const showToast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Cart writes run one after another, so quickly tapping + / - never sends overlapping requests.
  const enqueue = useCallback((task) => {
    const next = queueRef.current.then(task);
    queueRef.current = next.catch(() => {});
    return next;
  }, []);

  // ---- server data -> screen -------------------------------------------------
  const applyCart = useCallback((c) => {
    const byId = new Map(catalogRef.current.map((p) => [p.id, p]));
    setCart((c?.items || []).map((l) => {
      const base = byId.get(l.productId) || { id: l.productId, name: l.name, image: l.image, images: [l.image], hoverImage: null, sizes: [], colors: [], tags: [], genders: [], category: "", stock: l.stock ?? maxQty, price: l.unitPrice };
      return { ...base, itemId: l.itemId, size: l.size, color: l.color, qty: l.qty, numericPrice: l.unitPrice };
    }));
  }, [maxQty]);

  const refreshCart = useCallback(async () => {
    try { applyCart(await api.cart.get()); } catch { /* keep what is on screen */ }
  }, [applyCart]);

  // Everything that belongs to the account, loaded right after login / on page load. Returns the cart size.
  const loadAccountData = useCallback(async () => {
    const [c, w, , s] = await Promise.allSettled([api.cart.get(), api.wishlist.get(), loadAlerts(), api.user.sizePassport.get()]);
    if (c.status === "fulfilled") applyCart(c.value);
    if (w.status === "fulfilled") setWishlist(w.value.ids);
    if (s.status === "fulfilled") setSizeProfile(cleanPassport(s.value));
    return c.status === "fulfilled" ? c.value.count : 0;
  }, [applyCart]);

  const resetAccountData = useCallback(() => {
    setCart([]); setWishlist([]); setSizeProfile(EMPTY_PASSPORT); resetAlerts(); resetReferral();
  }, []);

  // Products from Dokani Cloud: the mock cart / checkout must know them (declared before the session restore below, so it runs first).
  useEffect(() => { if (catalog.some((p) => p.source === "dokani")) registerCatalog(catalog); }, [catalog]);

  // First load: restore the saved session (if the token is still valid), then the account data.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (tokenStore.get()) {
        try {
          const u = await api.auth.me();
          if (!alive) return;
          setSession(u);
          await loadAccountData();
        } catch (e) {
          if (e?.status === 401 || e?.status === 403) tokenStore.clear(); // dead token; a network error keeps it for next time
        }
      }
      restoringRef.current = false;
      if (alive) setHydrated(true);
    })();
    const onExpired = () => {
      setSession(null);
      resetAccountData();
      if (restoringRef.current) return; // a stale token found on page load: just start as a guest
      showToast("Your session expired. Please sign in again.", "error");
      setAuthView("login");
      setAuthModalOpen(true);
    };
    const onToast = (e) => showToast(e.detail?.msg, e.detail?.type);
    window.addEventListener("avenor:auth-expired", onExpired);
    window.addEventListener("avenor:toast", onToast);
    return () => { alive = false; window.removeEventListener("avenor:auth-expired", onExpired); window.removeEventListener("avenor:toast", onToast); };
  }, [loadAccountData, resetAccountData, setSession, showToast]);

  // ---- auth ------------------------------------------------------------------
  // Pass `resume` to continue what the person was doing once they have logged in (e.g. the add-to-cart they just tapped).
  const checkAuth = useCallback((resume) => {
    if (!userRef.current) {
      resumeRef.current = typeof resume === "function" ? resume : null;
      setAuthView("prompt");
      setAuthModalOpen(true); 
      return false;
    }
    return true;
  }, []);

  const afterAuth = useCallback(async (u, message) => {
    setSession(u);
    const cartCount = await loadAccountData();
    const resume = resumeRef.current;
    resumeRef.current = null;
    setAuthModalOpen(false);
    showToast(message, "success");
    if (resume) setTimeout(resume, 0);
    else if (cartCount > 0) openCart();
    return u;
  }, [loadAccountData, openCart, setSession, showToast]);

  // login({ email, password }) / register({ name, email, password, passwordConfirmation, terms, referral }): throw an ApiError on failure
  const login = useCallback(async (creds) => {
    const { user: u } = await api.auth.login(creds);
    return afterAuth(u, "Logged in successfully!");
  }, [afterAuth]);

  const register = useCallback(async (data) => {
    const { user: u } = await api.auth.register(data);
    return afterAuth(u, "Account created successfully!");
  }, [afterAuth]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setSession(null);
    resetAccountData();
  }, [resetAccountData, setSession]);

  const updateUser = useCallback((u) => setSession(u), [setSession]);

  // Closed the login popup without logging in: forget what they were doing, so it never runs at some later login.
  useEffect(() => { if (!authModalOpen) resumeRef.current = null; }, [authModalOpen]);

  // Public helpers: openAuth("login" | "register" | "prompt") opens the popup on that tab; setAuthModalOpen(true) opens it on "login".
  const openAuth = useCallback((view = "login") => { setAuthView(view); setAuthModalOpen(true); }, []);
  const closeAuth = useCallback(() => setAuthModalOpen(false), []);
  const toggleAuth = useCallback((open) => { if (open) setAuthView("login"); setAuthModalOpen(Boolean(open)); }, []);

  // ---- size passport ---------------------------------------------------------
  // Both return a Promise<boolean> (true = saved on the server).
  const saveSizeProfile = useCallback(async (raw) => {
    const clean = cleanPassport(raw);
    setSizeProfile(clean);
    try { setSizeProfile(cleanPassport(await api.user.sizePassport.save(clean))); return true; }
    catch (e) {
      showToast(e.message, "error");
      try { setSizeProfile(cleanPassport(await api.user.sizePassport.get())); } catch { /* keep the typed values */ }
      return false;
    }
  }, [showToast]);
  const clearSizeProfile = useCallback(async () => {
    setSizeProfile(EMPTY_PASSPORT);
    try { await api.user.sizePassport.clear(); return true; }
    catch (e) { showToast(e.message, "error"); return false; }
  }, [showToast]);
  const recommendFor = useCallback((product) => (hydrated ? recommendSize(sizeProfile, product) : null), [hydrated, sizeProfile]);

  // ---- cart ------------------------------------------------------------------
  const addToCartRef = useRef(null);
  const addToCart = useCallback((product, size, color, qty = 1) => {
    if (!checkAuth(() => addToCartRef.current?.(product, size, color, qty))) return;

    const existing = cartRef.current.find((item) => item.id === product.id && item.size === size && item.color === color);
    const limit = Math.min(maxQty, product.stock ?? maxQty);
    if (existing && existing.qty + qty > limit) {
      showToast(`Maximum ${limit} allowed`, "error");
      return;
    }

    return enqueue(async () => {
      try {
        applyCart(await api.cart.add({ productId: product.id, size, color, qty }));
        showToast("Added to cart", "success");
        openCart();
      } catch (e) { showToast(e.message, "error"); }
    });
  }, [checkAuth, enqueue, applyCart, showToast, openCart, maxQty]);
  addToCartRef.current = addToCart;

  // Mix & match: add several pieces at once (one login check, one toast, cart opens once). Returns false when login is needed first.
  const addOutfitRef = useRef(null);
  const addOutfit = useCallback((items, message) => {
    if (!checkAuth(() => addOutfitRef.current?.(items, message))) return false;
    enqueue(async () => {
      try {
        applyCart(await api.cart.addOutfit(items.map(({ product, size, color }) => ({ productId: product.id, size, color }))));
        showToast(message || "Outfit added to cart", "success");
        openCart();
      } catch (e) { showToast(e.message, "error"); }
    });
    return true;
  }, [checkAuth, enqueue, applyCart, showToast, openCart]);

  const quickAdd = useCallback((product) => {
    const size = recommendFor(product) || product.sizes?.[0] || "ONE";
    const color = product.colors?.[0]?.name || "";
    addToCart(product, size, color, 1);
  }, [addToCart, recommendFor]);

  const buyItNow = useCallback((product, size, qty = 1) => {
    const color = product.colors?.[0]?.name || "";
    addToCart(product, size, color, qty);
  }, [addToCart]);

  // Quantity / remove: the screen updates first, the API call follows; any failure puts the real cart back.
  const changeQty = useCallback((line, qty) => {
    if (!line) return;
    const q = Math.min(Math.max(1, qty), maxQty);
    setCart((prev) => prev.map((i) => (i.itemId === line.itemId ? { ...i, qty: q } : i)));
    enqueue(async () => {
      try { applyCart(await api.cart.setQty(line.itemId, q)); }
      catch (e) { showToast(e.message, "error"); await refreshCart(); }
    });
  }, [enqueue, applyCart, refreshCart, showToast, maxQty]);

  const updateCartQty = useCallback((id, size, color, qty) => {
    changeQty(cartRef.current.find((i) => i.id === id && i.size === size && i.color === color), qty);
  }, [changeQty]);

  const setQty = useCallback((key, qty) => {
    changeQty(cartRef.current.find((i) => keyOf(i) === key), qty);
  }, [changeQty]);

  const removeLine = useCallback((key) => {
    const line = cartRef.current.find((i) => keyOf(i) === key);
    if (!line) return;
    setCart((prev) => prev.filter((i) => i.itemId !== line.itemId));
    enqueue(async () => {
      try { applyCart(await api.cart.remove(line.itemId)); }
      catch (e) { showToast(e.message, "error"); await refreshCart(); }
    });
  }, [enqueue, applyCart, refreshCart, showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
    return enqueue(async () => {
      try { await api.cart.clear(); } catch (e) { showToast(e.message, "error"); await refreshCart(); }
    });
  }, [enqueue, refreshCart, showToast]);

  // ---- wishlist --------------------------------------------------------------
  const toggleWishRef = useRef(null);
  const toggleWish = useCallback((product) => {
    if (!checkAuth(() => toggleWishRef.current?.(product))) return;
    const id = product.id;
    const alreadyExists = wishlistRef.current.includes(id);

    if (alreadyExists) {
      showToast("Removed from wishlist");
      dropAlertLocal(id); // no wishlist item, no price alert (the server removes the alert too)
      setWishlist((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      showToast("Added to wishlist", "success");
      setWishlist((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
    enqueue(async () => {
      try { await (alreadyExists ? api.wishlist.remove(id) : api.wishlist.add(id)); }
      catch (e) {
        showToast(e.message, "error");
        try { setWishlist((await api.wishlist.get()).ids); await loadAlerts(); } catch { /* keep as is */ }
      }
    });
  }, [checkAuth, enqueue, showToast]);
  toggleWishRef.current = toggleWish;

  const isWished = useCallback((id) => wishlist.includes(id), [wishlist]);

  // Bell on a product card / wishlist row. Off -> on switches the alert on straight away and opens the
  // email / phone popup; on -> off just switches it off.
  const toggleAlertRef = useRef(null);
  const toggleAlert = useCallback((product) => {
    if (!checkAuth(() => toggleAlertRef.current?.(product)) || !alertsCopy) return;
    if (getAlerts().items[String(product.id)]) {
      disableAlert(product.id);
      showToast(alertsCopy.disabledToast.replace("{name}", product.name));
      return;
    }
    enableAlert(product.id, product.price);
    setAlertModal({ product, fresh: true });
  }, [checkAuth, alertsCopy, showToast]);
  toggleAlertRef.current = toggleAlert;

  useEffect(() => {
    if (cartOpen || authModalOpen || alertModal) document.body.style.overflow = 'hidden'; 
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, authModalOpen, alertModal]);

  const lines = cart.map((c) => ({
    key: keyOf(c),
    p: c,
    size: c.size,
    qty: c.qty,
    lineTotal: (c.numericPrice || 0) * c.qty
  }));
  
  const count = cart.reduce((acc, c) => acc + c.qty, 0);
  const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
  const delivery = subtotal === 0 || subtotal >= freeOver ? 0 : deliveryFee;
  const total = subtotal + delivery;

  useEffect(() => {
    if (count > prevCount.current) {
      setMiniCartDismissed(false);
    }
    prevCount.current = count;
  }, [count]);

  const fmt = useCallback((val) => {
    if (isNaN(val)) return `৳0`;
    return `৳${Number(val).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}`;
  }, [lang]);

  const num = useCallback((val) => {
    if (isNaN(val)) return val;
    return Number(val).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US');
  }, [lang]);

  const fill = useCallback((str, vars) => {
    if (!str) return "";
    let res = str;
    for (const k in vars) res = res.replace(`{${k}}`, vars[k]);
    return res;
  }, []);

  const value = useMemo(
    () => ({
      cart, wishlist, wish: wishlist, catalog, settings, labels: { ...(safeV2?.products || {}), ...(safeV2?.product || {}) }, ui: safeV2?.ui || {}, lang, 
      cartOpen, openCart, closeCart,
      user, isLoggedIn, login, register, logout, updateUser, authModalOpen, setAuthModalOpen: toggleAuth, authView, setAuthView, openAuth, closeAuth, checkAuth,
      addToCart, addOutfit, updateCartQty, removeLine, setQty, clearCart, refreshCart, toggleWish, isWished, quickAdd, buyItNow,
      toggleAlert, openAlertContact, alertsCopy,
      openQuickView, closeQuickView,
      lines, count, subtotal, delivery, total, hydrated, fmt, num, fill, showToast,
      sizeProfile, saveSizeProfile, clearSizeProfile, recommendFor,
      sizeLabel: (s) => (s === "ONE" ? (safeV2?.ui?.oneSize || "One Size") : s),
    }),
    [cart, wishlist, catalog, settings, safeV2, lang, toggleAlert, openAlertContact, alertsCopy, cartOpen, openCart, closeCart, user, isLoggedIn, login, register, logout, updateUser, authModalOpen, authView, toggleAuth, openAuth, closeAuth, checkAuth, addToCart, addOutfit, updateCartQty, removeLine, setQty, clearCart, refreshCart, toggleWish, isWished, quickAdd, buyItNow, openQuickView, closeQuickView, lines, count, subtotal, delivery, total, hydrated, fmt, num, fill, showToast, sizeProfile, saveSizeProfile, clearSizeProfile, recommendFor]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      
      {qvProduct && <V2QuickViewModal p={qvProduct} onClose={closeQuickView} />}

      {alertModal && alertsCopy && <V2AlertModal product={alertModal.product} fresh={alertModal.fresh} copy={alertsCopy} onClose={closeAlertModal} />}

      {hydrated && <V2QuickNav lang={lang} />}

      {/* LEFT BOTTOM FLOATING MINI CART */}
      {hydrated && count > 0 && !cartOpen && !miniCartDismissed && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px', 
          background: 'var(--v2-surface, #1e1d1b)',
          border: '1px solid var(--v2-line)',
          borderRadius: '16px',
          padding: '12px 16px 12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '30px',
          zIndex: 9998,
          boxShadow: '0 20px 40px var(--v2-shadow)',
          animation: 'slideUpLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          width: 'max-content',
          maxWidth: 'calc(100vw - 60px)' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--v2-ink)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--v2-font-body, sans-serif)' }}>
              {count} {count === 1 ? 'item' : 'items'} <span style={{ color: 'var(--v2-muted)' }}>·</span> {fmt(subtotal)}
            </div>
            <div style={{ fontSize: '13px', color: (freeOver - subtotal <= 0) ? 'var(--v2-brown)' : 'var(--v2-muted)' }}>
              {freeOver - subtotal <= 0 
                ? "You get free delivery" 
                : `Add ${fmt(freeOver - subtotal)} for free delivery`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => { setMiniCartDismissed(true); openCart(); }}
              style={{ background: 'var(--v2-btn-bg)', color: 'var(--v2-btn-fg)', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.target.style.opacity = '.85'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              View cart
            </button>
            <button 
              onClick={() => setMiniCartDismissed(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--v2-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px' }}
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      )}

      <V2AuthModal copy={safeV2?.auth} />

      {toasts.length > 0 && (
        <div 
          className="v2-toast-zone" 
          role="status" 
          aria-live="polite"
          style={{ position: 'fixed', bottom: '24px', right: '24px', left: 'auto', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}
        >
          {toasts.map((t) => (
            <div 
              key={t.id} 
              style={{
                pointerEvents: 'auto', background: t.type === 'error' ? 'var(--v2-sale)' : 'var(--v2-dark)', color: t.type === 'error' ? 'var(--v2-on-sale)' : 'var(--v2-on-dark)', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.2)', animation: 'slideInRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', display: 'flex', alignItems: 'center', minWidth: 'auto', maxWidth: '300px', letterSpacing: '0.3px'
              }}
            >
              <span style={{ marginRight: '10px', fontSize: '15px', display: 'flex', alignItems: 'center' }}>
                {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
              </span>
              {t.msg}
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideUpLeft { from { transform: translateY(120%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Ctx.Provider>
  );
}

export function useV2Store() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useV2Store must be used inside V2StoreProvider");
  return ctx;
}
