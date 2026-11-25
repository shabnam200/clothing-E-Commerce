"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/ui/AppLink";
import { usePathname, useRouter } from "next/navigation";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX, FiShield } from "react-icons/fi";
import { ROUTES } from "@/config/v2";
import { shopHref } from "@/lib/v2/filters";
import V2ThemeToggle from "@/components/v2/layout/V2ThemeToggle";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

const HEADER_CONTROL_ORDER = ["search", "wishlist", "cart", "account", "admin", "theme", "language"];

// A fresh page load that arrives from ANOTHER site (dokani.cloud, a search engine, any external link) must show the shop as a GUEST, even if this browser
// still holds an admin cookie. Runs once per full page load (module scope); reloads and back/forward are not "arrivals". Same-origin links never count.
// The admin cookie is httpOnly, so the browser cannot see it. The server also sets a harmless marker cookie (avenor_admin_hint) while an
// admin is signed in. Ordinary shoppers have no marker, so they no longer call /api/admin/session on every page and every 30 seconds.
const hasAdminHint = () => typeof document !== "undefined" && document.cookie.split("; ").includes("avenor_admin_hint=1");
const shouldProbeAdmin = () => {
  if (hasAdminHint()) return true;
  try { return !sessionStorage.getItem("avenor-admin-probed"); } catch { return false; } // one look per tab, for admins who signed in before the marker existed
};
let entryCheck = null;
function dropAdminOnExternalEntry() {
  if (!entryCheck) {
    entryCheck = (async () => {
      try {
        const nav = performance.getEntriesByType("navigation")[0];
        if (nav && nav.type !== "navigate") return;
        if (!document.referrer || new URL(document.referrer).origin === window.location.origin) return;
        await fetch("/api/admin/logout", { method: "POST", cache: "no-store", redirect: "manual" });
      } catch {}
    })();
  }
  return entryCheck;
}

export default function V2HeaderShell({ links, nav, search, logo, lang, settings = {}, announcementBar, showWishlist = true, showMiniCart = true }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminRevokedRef = useRef(false);
  const adminMenuRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef(null);
  const pageSlug = pathname.replace(/^\/+|\/+$/g, "");
  const pageLayout = (Array.isArray(settings.customPages) ? settings.customPages : []).find((page) => page?.published && page.slug === pageSlug)?.layout || {};
  const enabled = (key, fallback = true) => pageLayout[key] === undefined ? fallback : pageLayout[key] !== false;
  const showHeader = enabled("header");
  const showNav = enabled("navigation");
  const savedControlOrder = Array.isArray(pageLayout.headerControlOrder) ? pageLayout.headerControlOrder : [];
  const controlOrder = [...savedControlOrder.filter((key) => HEADER_CONTROL_ORDER.includes(key)), ...HEADER_CONTROL_ORDER.filter((key) => !savedControlOrder.includes(key))];
  const controlStyle = (key) => ({ order: controlOrder.indexOf(key) });
  
  // FIX: Added isLoggedIn and setAuthModalOpen from the store
  const { count, wish, hydrated, num, cartOpen, openCart, isLoggedIn, openAuth } = useV2Store();

  useEffect(() => {
    if (isLoggedIn) {
      // Customer sign-in invalidates the admin cookie in the server route.
      // Hide the admin menu immediately and leave the protected dashboard.
      setIsAdmin(false);
      setAdminMenuOpen(false);
      if (!adminRevokedRef.current) {
        adminRevokedRef.current = true;
        fetch("/api/admin/logout", { method: "POST", cache: "no-store" }).catch(() => {});
      }
      if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        router.replace("/");
        router.refresh();
      }
      return;
    }
    adminRevokedRef.current = false;

    let active = true;
    let sessionRevision = 0;
    const checkAdminSession = async () => {
      const revision = sessionRevision;
      try {
        await dropAdminOnExternalEntry();
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        try { sessionStorage.setItem("avenor-admin-probed", "1"); } catch {}
        const data = response.ok ? await response.json() : null;
        if (!active || revision !== sessionRevision) return;
        const authenticated = data?.authenticated === true;
        setIsAdmin(authenticated);
        if (!authenticated) {
          setAdminMenuOpen(false);
          if (pathname === "/admin" || pathname.startsWith("/admin/")) {
            router.replace("/");
            router.refresh();
          }
        }
      } catch {}
    };
    const onAdminSessionChange = (event) => {
      sessionRevision += 1;
      const authenticated = event.detail?.authenticated === true;
      setIsAdmin(authenticated);
      if (!authenticated) setAdminMenuOpen(false);
    };
    window.addEventListener("avenor-admin-session", onAdminSessionChange);
    if (shouldProbeAdmin() || pathname === "/admin" || pathname.startsWith("/admin/")) checkAdminSession();
    const sessionCheckTimer = window.setInterval(() => { if (hasAdminHint()) checkAdminSession(); }, 60000);
    return () => {
      active = false;
      window.clearInterval(sessionCheckTimer);
      window.removeEventListener("avenor-admin-session", onAdminSessionChange);
    };
  }, [isLoggedIn, pathname, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  
  useEffect(() => {
    if (!open && !searching) return;
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); setSearching(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, searching]);

  useEffect(() => {
    if (!adminMenuOpen) return;
    const onPointerDown = (event) => {
      if (!adminMenuRef.current?.contains(event.target)) setAdminMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setAdminMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [adminMenuOpen]);
  
  useEffect(() => { if (searching) inputRef.current?.focus(); }, [searching]);

  const current = (key) => (key === "home" ? pathname === ROUTES.home : key === "shop" ? pathname.startsWith(ROUTES.shop) || pathname.startsWith("/product") : key === "outfit" ? pathname.startsWith("/outfit") : false);
  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    setSearching(false); setOpen(false);
    router.push(shopHref({ q }));
  };
  
  const cartCount = hydrated ? count : 0;
  const wishCount = hydrated ? wish.length : 0; // (was: only ids found in the layout's first dozen products, so most hearts were not counted)
  const close = () => setOpen(false);

  if (!showHeader) return enabled("announcementBar") ? announcementBar : null;

  // FIX: Handle User Icon Click based on Login Status
  const handleAccountClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openAuth("login");
      setOpen(false);
    }
  };

  return (
    <>
    {enabled("announcementBar") && announcementBar}
    <header className={`v2-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="v2-wrap v2-header__row">
        {showNav && <button type="button" className="v2-icon-btn v2-menu-btn" aria-expanded={open} aria-controls="v2-drawer" aria-label={open ? nav.close : nav.open} onClick={() => { setOpen((v) => !v); setSearching(false); }}>
          {open ? <FiX /> : <FiMenu />}
        </button>}
        {enabled("logo") && logo}
        {showNav && <nav className="v2-links" aria-label={nav.label}>
          <ul>{links.map((l) => <li key={l.key}><Link href={l.href} aria-current={current(l.key) ? "page" : undefined}>{l.label}</Link></li>)}</ul>
        </nav>}
        <div className="v2-header__end">
          {enabled("search") && <button type="button" className="v2-icon-btn v2-search-btn" style={controlStyle("search")} aria-expanded={searching} aria-controls="v2-searchbar" aria-label={searching ? search.close : search.open} onClick={() => { setSearching((v) => !v); setOpen(false); }}>
            {searching ? <FiX /> : <FiSearch />}
          </button>}
          {showWishlist && enabled("wishlist") && <Link href={ROUTES.wishlist} className="v2-endlink v2-endlink--wide" style={controlStyle("wishlist")} aria-label={`${nav.wishlist}${wishCount ? ` (${wishCount})` : ""}`} title={nav.wishlist}>
            <FiHeart aria-hidden="true" /><span>{nav.wishlist}</span>{wishCount > 0 && <b className="v2-count" aria-hidden="true">{num(wishCount)}</b>}
          </Link>}
          {enabled("cart") && (showMiniCart ? <button type="button" className="v2-endlink" style={controlStyle("cart")} aria-haspopup="dialog" aria-expanded={cartOpen} aria-label={`${nav.cart} (${cartCount})`} title={nav.cart} onClick={() => { setOpen(false); setSearching(false); openCart(); }}>
            <FiShoppingBag aria-hidden="true" /><span>{nav.cart}</span>{cartCount > 0 && <b className="v2-count" aria-hidden="true">{num(cartCount)}</b>}
          </button> : <Link href={ROUTES.cart} className="v2-endlink" style={controlStyle("cart")} aria-label={`${nav.cart} (${cartCount})`} title={nav.cart}><FiShoppingBag aria-hidden="true" /><span>{nav.cart}</span>{cartCount > 0 && <b className="v2-count" aria-hidden="true">{num(cartCount)}</b>}</Link>)}
          
          {/* FIX: Account link dynamically goes to /account or opens pop-up */}
          {enabled("account") && <Link href={isLoggedIn ? "/account" : ROUTES.login} className="v2-endlink v2-endlink--wide" style={controlStyle("account")} aria-label={nav.account} title={nav.account} onClick={handleAccountClick}>
            <FiUser aria-hidden="true" /><span>{nav.account}</span>
          </Link>}
          {isAdmin && enabled("admin") && <div className="v2-admin-menu" ref={adminMenuRef} style={controlStyle("admin")}>
            <button type="button" className="v2-endlink v2-endlink--wide" aria-haspopup="menu" aria-expanded={adminMenuOpen} aria-label={nav.admin} title={nav.admin} onClick={() => setAdminMenuOpen((value) => !value)}>
              <FiShield aria-hidden="true" /><span>{nav.admin}</span>
            </button>
            {adminMenuOpen && <div className="v2-admin-menu__panel" role="menu">
              <Link href="/admin" role="menuitem" onClick={() => setAdminMenuOpen(false)}>{nav.websiteControl}</Link>
              <form action="/api/admin/logout" method="post"><button type="submit" role="menuitem">{nav.adminSignOut}</button></form>
            </div>}
          </div>}
          {enabled("theme") && <V2ThemeToggle toLight={nav.themeToLight} toDark={nav.themeToDark} style={controlStyle("theme")} />}
          {enabled("language") && <div className="v2-lang-wrap" style={controlStyle("language")}>{lang}</div>}
        </div>
      </div>
      {enabled("search") && <div id="v2-searchbar" className="v2-searchbar" hidden={!searching}>
        <form className="v2-wrap v2-searchbar__form" role="search" action={ROUTES.shop} onSubmit={onSearch}>
          <label htmlFor="v2-search-input" className="sr-only">{search.label}</label>
          <FiSearch aria-hidden="true" className="v2-searchbar__icon" />
          <input ref={inputRef} id="v2-search-input" name="q" type="search" autoComplete="off" placeholder={search.placeholder} />
          <button type="submit" className="v2-pill v2-pill--solid">{search.submit}</button>
        </form>
      </div>}
      {showNav && <nav id="v2-drawer" className="v2-drawer" hidden={!open} aria-label={nav.label}>
        <ul>
          {links.map((l) => <li key={l.key}><Link href={l.href} onClick={close} aria-current={current(l.key) ? "page" : undefined}>{l.label}</Link></li>)}
          {showWishlist && enabled("wishlist") && <li className="v2-drawer__sm"><Link href={ROUTES.wishlist} onClick={close}>{nav.wishlist}{wishCount > 0 ? ` (${wishCount})` : ""}</Link></li>}
          {isAdmin && enabled("admin") && <li className="v2-drawer__sm"><Link href="/admin" onClick={close}><FiShield aria-hidden="true" /> {nav.websiteControl}</Link></li>}
          {enabled("account") && <li className="v2-drawer__sm">
            {/* FIX: Mobile menu account link handler */}
            <Link href={isLoggedIn ? "/account" : ROUTES.login} onClick={(e) => {
              if (!isLoggedIn) { e.preventDefault(); openAuth("login"); }
              close();
            }}>
              {nav.account}
            </Link>
          </li>}
        </ul>
        {enabled("language") && <div className="v2-drawer__lang">{lang}</div>}
      </nav>}
    </header>
    </>
  );
}
