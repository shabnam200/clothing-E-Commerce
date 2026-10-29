"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX, FiShield } from "react-icons/fi";
import { ROUTES } from "@/config/v2";
import { shopHref } from "@/lib/v2/filters";
import V2ThemeToggle from "@/components/v2/layout/V2ThemeToggle";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2HeaderShell({ links, nav, search, logo, lang, showWishlist = true, showMiniCart = true }) {
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
  
  // FIX: Added isLoggedIn and setAuthModalOpen from the store
  const { count, wish, catalog, hydrated, num, cartOpen, openCart, isLoggedIn, openAuth } = useV2Store();

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
    fetch("/api/admin/session", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => { if (active) setIsAdmin(data?.authenticated === true); }).catch(() => {});
    return () => { active = false; };
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
  const catalogIds = new Set(catalog.map((p) => p.id));
  const wishCount = hydrated ? wish.filter((id) => catalogIds.has(id)).length : 0;
  const close = () => setOpen(false);

  // FIX: Handle User Icon Click based on Login Status
  const handleAccountClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      openAuth("login");
      setOpen(false);
    }
  };

  return (
    <header className={`v2-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="v2-wrap v2-header__row">
        <button type="button" className="v2-icon-btn v2-menu-btn" aria-expanded={open} aria-controls="v2-drawer" aria-label={open ? nav.close : nav.open} onClick={() => { setOpen((v) => !v); setSearching(false); }}>
          {open ? <FiX /> : <FiMenu />}
        </button>
        {logo}
        <nav className="v2-links" aria-label={nav.label}>
          <ul>{links.map((l) => <li key={l.key}><Link href={l.href} aria-current={current(l.key) ? "page" : undefined}>{l.label}</Link></li>)}</ul>
        </nav>
        <div className="v2-header__end">
          <button type="button" className="v2-icon-btn v2-search-btn" aria-expanded={searching} aria-controls="v2-searchbar" aria-label={searching ? search.close : search.open} onClick={() => { setSearching((v) => !v); setOpen(false); }}>
            {searching ? <FiX /> : <FiSearch />}
          </button>
          {showWishlist && <Link href={ROUTES.wishlist} className="v2-endlink v2-endlink--wide" aria-label={`${nav.wishlist}${wishCount ? ` (${wishCount})` : ""}`} title={nav.wishlist}>
            <FiHeart aria-hidden="true" /><span>{nav.wishlist}</span>{wishCount > 0 && <b className="v2-count" aria-hidden="true">{num(wishCount)}</b>}
          </Link>}
          {showMiniCart ? <button type="button" className="v2-endlink" aria-haspopup="dialog" aria-expanded={cartOpen} aria-label={`${nav.cart} (${cartCount})`} title={nav.cart} onClick={() => { setOpen(false); setSearching(false); openCart(); }}>
            <FiShoppingBag aria-hidden="true" /><span>{nav.cart}</span>{cartCount > 0 && <b className="v2-count" aria-hidden="true">{num(cartCount)}</b>}
          </button> : <Link href={ROUTES.cart} className="v2-endlink" aria-label={`${nav.cart} (${cartCount})`} title={nav.cart}><FiShoppingBag aria-hidden="true" /><span>{nav.cart}</span>{cartCount > 0 && <b className="v2-count" aria-hidden="true">{num(cartCount)}</b>}</Link>}
          
          {/* FIX: Account link dynamically goes to /account or opens pop-up */}
          <Link href={isLoggedIn ? "/account" : ROUTES.login} className="v2-endlink v2-endlink--wide" aria-label={nav.account} title={nav.account} onClick={handleAccountClick}>
            <FiUser aria-hidden="true" /><span>{nav.account}</span>
          </Link>
          {isAdmin && <div className="v2-admin-menu" ref={adminMenuRef}>
            <button type="button" className="v2-endlink v2-endlink--wide" aria-haspopup="menu" aria-expanded={adminMenuOpen} aria-label={nav.admin} title={nav.admin} onClick={() => setAdminMenuOpen((value) => !value)}>
              <FiShield aria-hidden="true" /><span>{nav.admin}</span>
            </button>
            {adminMenuOpen && <div className="v2-admin-menu__panel" role="menu">
              <Link href="/admin" role="menuitem" onClick={() => setAdminMenuOpen(false)}>{nav.websiteControl}</Link>
              <form action="/api/admin/logout" method="post"><button type="submit" role="menuitem">{nav.adminSignOut}</button></form>
            </div>}
          </div>}
          <V2ThemeToggle toLight={nav.themeToLight} toDark={nav.themeToDark} />
          <div className="v2-lang-wrap">{lang}</div>
        </div>
      </div>
      <div id="v2-searchbar" className="v2-searchbar" hidden={!searching}>
        <form className="v2-wrap v2-searchbar__form" role="search" action={ROUTES.shop} onSubmit={onSearch}>
          <label htmlFor="v2-search-input" className="sr-only">{search.label}</label>
          <FiSearch aria-hidden="true" className="v2-searchbar__icon" />
          <input ref={inputRef} id="v2-search-input" name="q" type="search" autoComplete="off" placeholder={search.placeholder} />
          <button type="submit" className="v2-pill v2-pill--solid">{search.submit}</button>
        </form>
      </div>
      <nav id="v2-drawer" className="v2-drawer" hidden={!open} aria-label={nav.label}>
        <ul>
          {links.map((l) => <li key={l.key}><Link href={l.href} onClick={close} aria-current={current(l.key) ? "page" : undefined}>{l.label}</Link></li>)}
          {showWishlist && <li className="v2-drawer__sm"><Link href={ROUTES.wishlist} onClick={close}>{nav.wishlist}{wishCount > 0 ? ` (${wishCount})` : ""}</Link></li>}
          {isAdmin && <li className="v2-drawer__sm"><Link href="/admin" onClick={close}><FiShield aria-hidden="true" /> {nav.websiteControl}</Link></li>}
          <li className="v2-drawer__sm">
            {/* FIX: Mobile menu account link handler */}
            <Link href={isLoggedIn ? "/account" : ROUTES.login} onClick={(e) => {
              if (!isLoggedIn) { e.preventDefault(); openAuth("login"); }
              close();
            }}>
              {nav.account}
            </Link>
          </li>
        </ul>
        <div className="v2-drawer__lang">{lang}</div>
      </nav>
    </header>
  );
}
