"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi"; 
import { MAX_QTY, FREE_DELIVERY_OVER, DELIVERY_FEE } from "@/config/v2"; 
import V2QuickNav from "@/components/v2/layout/V2QuickNav";
import V2QuickViewModal from "@/components/v2/product/V2QuickViewModal";
import { buildCatalog } from "@/lib/v2/catalog"; 
import { SIZE_KEY, EMPTY_PASSPORT, cleanPassport, recommendSize } from "@/lib/v2/size";
import { disableAlert, enableAlert, getAlerts } from "@/lib/v2/priceAlerts";
import V2AlertModal from "@/components/v2/cart/V2AlertModal";

const WISH_KEY = "avenor:v2:wish:v1"; // wishlist ids, kept so price-drop alerts survive a reload
const CART_KEY = "avenor:v2:cart:v1"; // cart lines [{ id, size, color, qty }] kept across reloads

// Only the small, stable part of a cart line is saved; name / price / image are re-read from the catalog on load.
const slimLine = (l) => ({ id: l.id, size: l.size, color: l.color ?? "", qty: l.qty });
const validLine = (l) => l && (Number.isInteger(l.id) || typeof l.id === "string") && typeof l.size === "string" && Number.isInteger(l.qty) && l.qty > 0;

const Ctx = createContext(null);

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

export default function V2StoreProvider({ children, v2, lang }) {
  const safeV2 = useMemo(() => sanitizeData(v2), [v2]);
  
  const catalog = useMemo(() => {
    try {
      return buildCatalog(safeV2, lang) || [];
    } catch (err) {
      return [];
    }
  }, [safeV2, lang]);

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

  const [isLoggedInState, setIsLoggedInState] = useState(false); 
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState("prompt"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [miniCartDismissed, setMiniCartDismissed] = useState(false);
  const prevCount = useRef(0);

  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;

  // Read everything saved on this device once, after mount (server HTML and first client render stay identical).
  useEffect(() => {
    try { const raw = localStorage.getItem(SIZE_KEY); if (raw) setSizeProfile(cleanPassport(JSON.parse(raw))); } catch { /* ignore broken data */ }
    try { const w = JSON.parse(localStorage.getItem(WISH_KEY) || "[]"); if (Array.isArray(w)) setWishlist(w.filter(Number.isInteger)); } catch { /* ignore broken data */ }
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (Array.isArray(saved)) {
        const byId = new Map(catalogRef.current.map((p) => [p.id, p]));
        const restored = saved.filter(validLine).flatMap((l) => {
          const p = byId.get(l.id);
          if (!p) return []; // product no longer exists
          const limit = Math.min(MAX_QTY, p.stock ?? MAX_QTY);
          return [{ ...p, size: l.size, color: l.color ?? "", qty: Math.min(l.qty, limit), numericPrice: p.price || 0 }];
        });
        if (restored.length) setCart(restored);
      }
    } catch { /* ignore broken data */ }
    setHydrated(true);
    try { if (localStorage.getItem("avenor_isLoggedIn") === "true") setIsLoggedInState(true); } catch { /* private mode */ }
  }, []);

  // Save on every change (but never before the saved data has been read, or an empty cart would overwrite it).
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)); } catch { /* private mode */ }
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart.map(slimLine))); } catch { /* private mode */ }
  }, [cart, hydrated]);

  const setIsLoggedIn = useCallback((status) => {
    setIsLoggedInState(status);
    if (status) {
      localStorage.setItem("avenor_isLoggedIn", "true");
    } else {
      localStorage.removeItem("avenor_isLoggedIn");
    }
  }, []);

  const isLoggedIn = isLoggedInState;

  const showToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const checkAuth = useCallback(() => {
    if (!isLoggedIn) {
      setAuthView("prompt");
      setAuthModalOpen(true); 
      return false;
    }
    return true;
  }, [isLoggedIn]);

  const handleModalLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      setIsLoggedIn(true);
      setAuthModalOpen(false);
      showToast("Logged in successfully!", "success");
      if (cart.length > 0) openCart(); 
    }, 1000);
  };

  const handleModalRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setTimeout(() => {
      setAuthLoading(false);
      setIsLoggedIn(true);
      setAuthModalOpen(false);
      showToast("Account created successfully!", "success");
      if (cart.length > 0) openCart(); 
    }, 1000);
  };

  // Size passport: measurements saved on this device (swap for an API call when the backend exists).
  const saveSizeProfile = useCallback((raw) => {
    const clean = cleanPassport(raw);
    setSizeProfile(clean);
    try { localStorage.setItem(SIZE_KEY, JSON.stringify(clean)); } catch { /* private mode */ }
  }, []);
  const clearSizeProfile = useCallback(() => {
    setSizeProfile(EMPTY_PASSPORT);
    try { localStorage.removeItem(SIZE_KEY); } catch { /* private mode */ }
  }, []);
  const recommendFor = useCallback((product) => (hydrated ? recommendSize(sizeProfile, product) : null), [hydrated, sizeProfile]);

  const addToCart = useCallback((product, size, color, qty = 1) => {
    if (!checkAuth()) return;

    const existing = cart.find((item) => item.id === product.id && item.size === size && item.color === color);
    const limit = Math.min(MAX_QTY, product.stock ?? MAX_QTY);

    if (existing && existing.qty + qty > limit) {
      showToast(`Maximum ${limit} allowed`, "error");
      return;
    }

    setCart((prev) => {
      const existingInside = prev.find((item) => item.id === product.id && item.size === size && item.color === color);
      if (existingInside) {
        return prev.map((item) =>
          item.id === product.id && item.size === size && item.color === color
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      const numericPrice = product.price || parseInt(String(product.priceText || "0").replace(/[^0-9]/g, "")) || 0;
      return [...prev, { ...product, size, color, qty, numericPrice }];
    });
    
    showToast("Added to cart", "success");
    openCart();
  }, [cart, showToast, openCart, checkAuth]);

  // Mix & match: add several pieces at once (one login check, one toast, cart opens once).
  const addOutfit = useCallback((items, message) => {
    if (!checkAuth()) return false;
    setCart((prev) => {
      const next = [...prev];
      for (const { product, size, color } of items) {
        const limit = Math.min(MAX_QTY, product.stock ?? MAX_QTY);
        const i = next.findIndex((l) => l.id === product.id && l.size === size && l.color === color);
        if (i >= 0) next[i] = { ...next[i], qty: Math.min(limit, next[i].qty + 1) };
        else next.push({ ...product, size, color, qty: 1, numericPrice: product.price || 0 });
      }
      return next;
    });
    showToast(message || "Outfit added to cart", "success");
    openCart();
    return true;
  }, [checkAuth, showToast, openCart]);

  const quickAdd = useCallback((product) => {
    const size = recommendFor(product) || product.sizes?.[0] || "ONE";
    const color = product.colors?.[0]?.name || "";
    addToCart(product, size, color, 1);
  }, [addToCart, recommendFor]);

  const buyItNow = useCallback((product, size, qty = 1) => {
    if (!checkAuth()) return; 
    const color = product.colors?.[0]?.name || "";
    addToCart(product, size, color, qty);
  }, [addToCart, checkAuth]);

  const updateCartQty = useCallback((id, size, color, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.size === size && item.color === color
          ? { ...item, qty: Math.min(Math.max(1, qty), MAX_QTY) }
          : item
      )
    );
  }, []);

  const removeLine = useCallback((key) => {
    setCart((prev) => prev.filter((item) => `${item.id}-${item.size}-${item.color}` !== key));
  }, []);

  const setQty = useCallback((key, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        `${item.id}-${item.size}-${item.color}` === key
          ? { ...item, qty: Math.min(Math.max(1, qty), MAX_QTY) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWish = useCallback((product) => {
    const id = product.id;
    const alreadyExists = wishlist.includes(id);

    if (alreadyExists) {
      showToast("Removed from wishlist");
      disableAlert(id); // no wishlist item, no price alert
      setWishlist((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      showToast("Added to wishlist", "success");
      setWishlist((prev) => [...prev, id]);
    }
  }, [wishlist, showToast]);

  const isWished = useCallback((id) => wishlist.includes(id), [wishlist]);

  // Bell on a product card / wishlist row. Off -> on switches the alert on straight away and opens the
  // email / phone popup; on -> off just switches it off.
  const toggleAlert = useCallback((product) => {
    if (!checkAuth() || !alertsCopy) return;
    if (getAlerts().items[String(product.id)]) {
      disableAlert(product.id);
      showToast(alertsCopy.disabledToast.replace("{name}", product.name));
      return;
    }
    enableAlert(product.id, product.price);
    setAlertModal({ product, fresh: true });
  }, [checkAuth, alertsCopy, showToast]);

  useEffect(() => {
    if (cartOpen || authModalOpen || alertModal) document.body.style.overflow = 'hidden'; 
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, authModalOpen, alertModal]);

  const lines = cart.map((c) => ({
    key: `${c.id}-${c.size}-${c.color}`,
    p: c,
    size: c.size,
    qty: c.qty,
    lineTotal: (c.numericPrice || 0) * c.qty
  }));
  
  const count = cart.reduce((acc, c) => acc + c.qty, 0);
  const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
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
      cart, wishlist, wish: wishlist, catalog, labels: { ...(safeV2?.products || {}), ...(safeV2?.product || {}) }, ui: safeV2?.ui || {}, lang, 
      cartOpen, openCart, closeCart,
      isLoggedIn, setIsLoggedIn, authModalOpen, setAuthModalOpen, 
      addToCart, addOutfit, updateCartQty, removeLine, setQty, clearCart, toggleWish, isWished, quickAdd, buyItNow,
      toggleAlert, openAlertContact, alertsCopy,
      openQuickView, closeQuickView,
      lines, count, subtotal, delivery, total, hydrated, fmt, num, fill, showToast,
      sizeProfile, saveSizeProfile, clearSizeProfile, recommendFor,
      sizeLabel: (s) => (s === "ONE" ? (safeV2?.ui?.oneSize || "One Size") : s),
    }),
    [cart, wishlist, catalog, safeV2, lang, toggleAlert, openAlertContact, alertsCopy, cartOpen, openCart, closeCart, isLoggedIn, authModalOpen, addToCart, addOutfit, updateCartQty, removeLine, setQty, clearCart, toggleWish, isWished, quickAdd, buyItNow, openQuickView, closeQuickView, lines, count, subtotal, delivery, total, hydrated, fmt, num, fill, showToast, sizeProfile, saveSizeProfile, clearSizeProfile, recommendFor]
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
            <div style={{ fontSize: '13px', color: (FREE_DELIVERY_OVER - subtotal <= 0) ? 'var(--v2-brown)' : 'var(--v2-muted)' }}>
              {FREE_DELIVERY_OVER - subtotal <= 0 
                ? "You get free delivery" 
                : `Add ${fmt(FREE_DELIVERY_OVER - subtotal)} for free delivery`}
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

      {authModalOpen && (
        <div className="v2-qv-overlay" onClick={() => setAuthModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, background: 'var(--v2-scrim)', backdropFilter: 'blur(5px)', position: 'fixed', inset: 0 }}>
          
          <div className="v2-qv-modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', background: 'var(--v2-surface, #1e1d1b)', padding: '32px 28px', borderRadius: '12px', textAlign: authView !== "prompt" ? 'left' : 'center', maxWidth: '400px', width: '90%', border: '1px solid var(--v2-line)', boxShadow: '0 20px 40px var(--v2-shadow)', transition: 'all 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <button type="button" aria-label="Close" onClick={() => setAuthModalOpen(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--v2-ink)', cursor: 'pointer', display: 'flex' }}>
              <FiX size={22} />
            </button>

            {authView === "prompt" && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '8px', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font-display, serif)' }}>Sign in required</h2>
                <p style={{ color: 'var(--v2-muted, #888)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>Please log in or create an account to access this feature.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthView("login")} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13.5px' }}>Log In</button>
                  <button type="button" className="v2-pill v2-pill--outline" onClick={() => setAuthView("register")} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13.5px', textAlign: 'center' }}>Create Account</button>
                </div>
              </div>
            )}

            {authView === "login" && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '26px', fontWeight: '400', marginBottom: '6px', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font-display, serif)' }}>Welcome Back</h2>
                <p style={{ color: 'var(--v2-muted)', fontSize: '13.5px', marginBottom: '24px' }}>Sign in to your AVENOR account.</p>
                
                <form onSubmit={handleModalLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--v2-ink)', fontWeight: '500' }}>Email address</label>
                    <input name="email" type="email" required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid var(--v2-line)', color: 'var(--v2-ink)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--v2-ink)'} onBlur={(e) => e.target.style.borderColor = 'var(--v2-line)'} />
                  </div>
                  
                  <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--v2-ink)', fontWeight: '500' }}>Password</label>
                    <input name="password" type={showPw ? "text" : "password"} required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid var(--v2-line)', color: 'var(--v2-ink)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--v2-ink)'} onBlur={(e) => e.target.style.borderColor = 'var(--v2-line)'} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', bottom: '11px', background: 'none', border: 'none', color: 'var(--v2-muted)', cursor: 'pointer', fontSize: '13px' }}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  <button type="submit" disabled={authLoading} className="v2-pill v2-pill--solid" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: '600', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px', color: 'var(--v2-muted)' }}>
                  New to AVENOR? <button type="button" onClick={() => setAuthView("register")} style={{ background: 'none', border: 'none', color: 'var(--v2-ink)', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '13.5px', padding: 0 }}>Create an account</button>
                </p>
              </div>
            )}

            {authView === "register" && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '26px', fontWeight: '400', marginBottom: '6px', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font-display, serif)' }}>Create Account</h2>
                <p style={{ color: 'var(--v2-muted)', fontSize: '13.5px', marginBottom: '24px' }}>Join AVENOR for exclusive benefits.</p>
                
                <form onSubmit={handleModalRegister}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--v2-ink)', fontWeight: '500' }}>Full Name</label>
                    <input name="name" type="text" required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid var(--v2-line)', color: 'var(--v2-ink)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--v2-ink)'} onBlur={(e) => e.target.style.borderColor = 'var(--v2-line)'} />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--v2-ink)', fontWeight: '500' }}>Email address</label>
                    <input name="email" type="email" required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid var(--v2-line)', color: 'var(--v2-ink)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--v2-ink)'} onBlur={(e) => e.target.style.borderColor = 'var(--v2-line)'} />
                  </div>
                  
                  <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--v2-ink)', fontWeight: '500' }}>Password</label>
                    <input name="password" type={showPw ? "text" : "password"} required placeholder="" minLength={8} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid var(--v2-line)', color: 'var(--v2-ink)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--v2-ink)'} onBlur={(e) => e.target.style.borderColor = 'var(--v2-line)'} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', bottom: '11px', background: 'none', border: 'none', color: 'var(--v2-muted)', cursor: 'pointer', fontSize: '13px' }}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  <button type="submit" disabled={authLoading} className="v2-pill v2-pill--solid" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', fontWeight: '600', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? "Creating account..." : "Create Account"}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px', color: 'var(--v2-muted)' }}>
                  Already have an account? <button type="button" onClick={() => setAuthView("login")} style={{ background: 'none', border: 'none', color: 'var(--v2-ink)', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '13.5px', padding: 0 }}>Sign in</button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
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
