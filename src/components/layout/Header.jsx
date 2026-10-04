import { FiHeart, FiSearch, FiShoppingBag } from "react-icons/fi";
import { NAV_LINKS } from "@/config/site";
import Logo from "@/components/ui/Logo";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import LangToggle from "./LangToggle";

export default function Header({ t, lang }) {
  const links = NAV_LINKS.map((l) => ({ ...l, label: t.nav[l.key] }));
  return (
    <header className="sticky top-0 z-50 bg-header/95 shadow-lg backdrop-blur">
      <div className="relative mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block"><NavLinks links={links} className="flex items-center gap-2" /></nav>
        <div className="ml-auto flex items-center gap-3">
          <form role="search" className="hidden w-64 items-center gap-2 rounded-full border border-line px-4 py-2 md:flex">
            <FiSearch className="text-muted" aria-hidden="true" />
            <input type="search" placeholder={t.ui.search} aria-label={t.ui.search} className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
          </form>
          <button type="button" aria-label={t.ui.wishlist} className="text-2xl hover:text-accent"><FiHeart /></button>
          <button type="button" aria-label={`${t.ui.cart} 0`} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xl text-black">
            <FiShoppingBag />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sale text-[11px] font-bold text-white">0</span>
          </button>
          <LangToggle lang={lang} t={t} />
          <MobileMenu links={links} openLabel={t.ui.menuOpen} closeLabel={t.ui.menuClose} />
        </div>
      </div>
    </header>
  );
}
