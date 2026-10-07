"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi"; 
import { MAX_QTY, FREE_DELIVERY_OVER } from "@/config/v2"; 
import V2QuickViewModal from "@/components/v2/product/V2QuickViewModal";
import { buildCatalog } from "@/lib/v2/catalog"; 

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

  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const [qvProduct, setQvProduct] = useState(null);
  const openQuickView = useCallback((product) => setQvProduct(product), []);
  const closeQuickView = useCallback(() => setQvProduct(null), []);

  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState("prompt"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [miniCartDismissed, setMiniCartDismissed] = useState(false);
  const prevCount = useRef(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  const quickAdd = useCallback((product) => {
    const size = product.sizes?.[0] || "ONE";
    const color = product.colors?.[0]?.name || "";
    addToCart(product, size, color, 1);
  }, [addToCart]);

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

  const toggleWish = useCallback((product) => {
    const id = product.id;
    const alreadyExists = wishlist.includes(id);

    if (alreadyExists) {
      showToast("Removed from wishlist");
      setWishlist((prev) => prev.filter((itemId) => itemId !== id));
    } else {
      showToast("Added to wishlist", "success");
      setWishlist((prev) => [...prev, id]);
    }
  }, [wishlist, showToast]);

  const isWished = useCallback((id) => wishlist.includes(id), [wishlist]);

  useEffect(() => {
    if (cartOpen || authModalOpen) document.body.style.overflow = 'hidden'; 
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, authModalOpen]);

  const lines = cart.map((c) => ({
    key: `${c.id}-${c.size}-${c.color}`,
    p: c,
    size: c.size,
    qty: c.qty,
    lineTotal: (c.numericPrice || 0) * c.qty
  }));
  
  const count = cart.reduce((acc, c) => acc + c.qty, 0);
  const subtotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);

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
      cart, wishlist, wish: wishlist, catalog, labels: safeV2?.product || {}, ui: safeV2?.ui || {}, lang, 
      cartOpen, openCart, closeCart,
      isLoggedIn, setIsLoggedIn, authModalOpen, setAuthModalOpen, 
      addToCart, updateCartQty, removeLine, setQty, toggleWish, isWished, quickAdd, buyItNow,
      openQuickView, closeQuickView,
      lines, count, subtotal, hydrated, fmt, num, fill,
      sizeLabel: (s) => (s === "ONE" ? (safeV2?.ui?.oneSize || "One Size") : s),
    }),
    [cart, wishlist, catalog, safeV2, lang, cartOpen, openCart, closeCart, isLoggedIn, authModalOpen, addToCart, updateCartQty, removeLine, setQty, toggleWish, isWished, quickAdd, buyItNow, openQuickView, closeQuickView, lines, count, subtotal, hydrated, fmt, num, fill]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      
      {qvProduct && <V2QuickViewModal p={qvProduct} onClose={closeQuickView} />}

      {authModalOpen && (
        <div className="v2-qv-overlay" onClick={() => setAuthModalOpen(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', position: 'fixed', inset: 0 }}>
          
          <div className="v2-qv-modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', background: 'var(--v2-surface, #1e1d1b)', padding: '32px 28px', borderRadius: '12px', textAlign: authView !== "prompt" ? 'left' : 'center', maxWidth: '400px', width: '90%', border: '1px solid #333', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', transition: 'all 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <button type="button" aria-label="Close" onClick={() => setAuthModalOpen(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
              <FiX size={22} />
            </button>

            {authView === "prompt" && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '20px', fontWeight: '500', marginBottom: '8px', color: '#fff', fontFamily: 'var(--v2-font-display, serif)' }}>Sign in required</h2>
                <p style={{ color: 'var(--v2-muted, #888)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>Please log in or create an account to access this feature.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button type="button" className="v2-pill v2-pill--solid" onClick={() => setAuthView("login")} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13.5px' }}>Log In</button>
                  <button type="button" className="v2-pill v2-pill--outline" onClick={() => setAuthView("register")} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13.5px', textAlign: 'center' }}>Create Account</button>
                </div>
              </div>
            )}

            {authView === "login" && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '26px', fontWeight: '400', marginBottom: '6px', color: '#fff', fontFamily: 'var(--v2-font-display, serif)' }}>Welcome Back</h2>
                <p style={{ color: '#aaa', fontSize: '13.5px', marginBottom: '24px' }}>Sign in to your AVENOR account.</p>
                
                <form onSubmit={handleModalLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>Email address</label>
                    <input name="email" type="email" required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#444'} />
                  </div>
                  
                  <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>Password</label>
                    <input name="password" type={showPw ? "text" : "password"} required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#444'} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', bottom: '11px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  <button type="submit" disabled={authLoading} className="v2-pill v2-pill--solid" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', background: '#f3eee5', color: '#000', fontWeight: '600', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px', color: '#aaa' }}>
                  New to AVENOR? <button type="button" onClick={() => setAuthView("register")} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '13.5px', padding: 0 }}>Create an account</button>
                </p>
              </div>
            )}

            {authView === "register" && (
              <div className="animate-fade-in">
                <h2 style={{ fontSize: '26px', fontWeight: '400', marginBottom: '6px', color: '#fff', fontFamily: 'var(--v2-font-display, serif)' }}>Create Account</h2>
                <p style={{ color: '#aaa', fontSize: '13.5px', marginBottom: '24px' }}>Join AVENOR for exclusive benefits.</p>
                
                <form onSubmit={handleModalRegister}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>Full Name</label>
                    <input name="name" type="text" required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#444'} />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>Email address</label>
                    <input name="email" type="email" required placeholder="" style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#444'} />
                  </div>
                  
                  <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>Password</label>
                    <input name="password" type={showPw ? "text" : "password"} required placeholder="" minLength={8} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#fff'} onBlur={(e) => e.target.style.borderColor = '#444'} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', bottom: '11px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  <button type="submit" disabled={authLoading} className="v2-pill v2-pill--solid" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', background: '#f3eee5', color: '#000', fontWeight: '600', opacity: authLoading ? 0.7 : 1 }}>
                    {authLoading ? "Creating account..." : "Create Account"}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px', color: '#aaa' }}>
                  Already have an account? <button type="button" onClick={() => setAuthView("login")} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: '500', cursor: 'pointer', fontSize: '13.5px', padding: 0 }}>Sign in</button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FIX: GLOBAL FLOATING MINI CART - MOVED TO BOTTOM LEFT */}
      {hydrated && count > 0 && !cartOpen && !miniCartDismissed && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '30px', // FIX: Positioned to the left corner
          background: 'var(--v2-surface, #1e1d1b)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '12px 16px 12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '30px',
          zIndex: 9998,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          animation: 'slideUpLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          width: 'max-content',
          maxWidth: 'calc(100vw - 60px)' // Prevents overflow on very small screens
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--v2-font-body, sans-serif)' }}>
              {count} {count === 1 ? 'item' : 'items'} <span style={{ color: '#888' }}>·</span> {fmt(subtotal)}
            </div>
            <div style={{ fontSize: '13px', color: (FREE_DELIVERY_OVER - subtotal <= 0) ? '#4ade80' : '#aaa' }}>
              {FREE_DELIVERY_OVER - subtotal <= 0 
                ? "You get free delivery" 
                : `Add ${fmt(FREE_DELIVERY_OVER - subtotal)} for free delivery`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => { setMiniCartDismissed(true); openCart(); }}
              style={{ background: '#333', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.target.style.background = '#444'}
              onMouseOut={(e) => e.target.style.background = '#333'}
            >
              View cart
            </button>
            <button 
              onClick={() => setMiniCartDismissed(true)}
              style={{ background: 'transparent', border: 'none', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '4px' }}
            >
              <FiX size={20} />
            </button>
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
                pointerEvents: 'auto', background: t.type === 'error' ? '#9c4a3a' : '#1e1d1b', color: '#f3eee5', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.2)', animation: 'slideInRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', display: 'flex', alignItems: 'center', minWidth: 'auto', maxWidth: '300px', letterSpacing: '0.3px'
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
        /* FIX: Updated animation for bottom-left placement */
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