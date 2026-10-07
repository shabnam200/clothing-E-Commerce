"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { ROUTES } from "@/config/v2";
import { shopHref } from "@/lib/v2/filters";
import V2ThemeToggle from "@/components/v2/layout/V2ThemeToggle";
import { useV2Store } from "@/components/v2/store/V2StoreProvider";

export default function V2HeaderShell({ links, nav, search, logo, lang }) {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef(null);
  
  // FIX: Added isLoggedIn and setAuthModalOpen from the store
  const { count, wish, hydrated, num, cartOpen, openCart, isLoggedIn, setAuthModalOpen } = useV2Store();

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
  
  useEffect(() => { if (searching) inputRef.current?.focus(); }, [searching]);

  const current = (key) => (key === "home" ? pathname === ROUTES.home : key === "shop" ? pathname.startsWith(ROUTES.shop) || pathname.startsWith("/product") : false);
  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    setSearching(false); setOpen(false);
    router.push(shopHref({ q }));
  };
  
  const cartCount = hydrated ? count : 0;
  const wishCount = hydrated ? wish.length : 0;
  const close = () => setOpen(false);

  // FIX: Handle User Icon Click based on Login Status
  const handleAccountClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setAuthModalOpen(true);
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
          <Link href={ROUTES.wishlist} className="v2-endlink v2-endlink--wide" aria-label={`${nav.wishlist}${wishCount ? ` (${wishCount})` : ""}`}>
            <FiHeart aria-hidden="true" /><span>{nav.wishlist}</span>{wishCount > 0 && <b className="v2-count" aria-hidden="true">{num(wishCount)}</b>}
          </Link>
          <button type="button" className="v2-endlink" aria-haspopup="dialog" aria-expanded={cartOpen} aria-label={`${nav.cart} (${cartCount})`} onClick={() => { setOpen(false); setSearching(false); openCart(); }}>
            <FiShoppingBag aria-hidden="true" /><span>{nav.cart}</span>{cartCount > 0 && <b className="v2-count" aria-hidden="true">{num(cartCount)}</b>}
          </button>
          
          {/* FIX: Account link dynamically goes to /account or opens pop-up */}
          <Link href={isLoggedIn ? "/account" : ROUTES.login} className="v2-endlink v2-endlink--wide" aria-label={nav.account} onClick={handleAccountClick}>
            <FiUser aria-hidden="true" /><span>{nav.account}</span>
          </Link>
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
          <li className="v2-drawer__sm"><Link href={ROUTES.wishlist} onClick={close}>{nav.wishlist}{wishCount > 0 ? ` (${num(wishCount)})` : ""}</Link></li>
          <li className="v2-drawer__sm">
            {/* FIX: Mobile menu account link handler */}
            <Link href={isLoggedIn ? "/account" : ROUTES.login} onClick={(e) => {
              if (!isLoggedIn) { e.preventDefault(); setAuthModalOpen(true); }
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