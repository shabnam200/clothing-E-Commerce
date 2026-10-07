import { ROUTES } from "@/config/v2";
import V2HeaderShell from "./V2HeaderShell";
import V2LangToggle from "./V2LangToggle";
import V2Logo from "@/components/v2/ui/V2Logo";
import V2PromoBar from "@/components/v2/layout/V2PromoBar";

export default function V2Header({ v2, lang }) {
  const links = [
    { key: "home", label: v2.nav.home, href: ROUTES.home },
    
    { key: "categories", label: lang === 'bn' ? "ক্যাটাগরি" : "Categories", href: `${ROUTES.home}#shop-categories-section` },
    
    // "Our Picks" landing page er Our Picks section e jabe
    { key: "our-picks", label: lang === 'bn' ? "আওয়ার পিক্স" : "Our Picks", href: `${ROUTES.home}#shop` },
    
    // "Shop" click korle direct main shop page e jabe
    // { key: "shop", label: v2.nav.shop, href: ROUTES.shop },
    
    // { key: "sale", label: v2.products?.sale || (lang === 'bn' ? "সেল" : "Sale"), href: `${ROUTES.shop}?tag=sale`, tone: "sale" },
    
    // { key: "lookbook", label: v2.nav.lookbook, href: ROUTES.lookbook },
    
    { key: "about", label: v2.nav.about, href: ROUTES.about },
  ];
  
  const toggle = <V2LangToggle lang={lang} label={v2.nav.lang} ariaLabel={v2.nav.langAria} />;
  
  return (
    <>
      <V2PromoBar />
      <V2HeaderShell links={links} nav={v2.nav} search={v2.search} logo={<V2Logo />} lang={toggle} />
    </>
  );
}