import { ROUTES } from "@/config/v2";
import V2HeaderShell from "./V2HeaderShell";
import V2LangToggle from "./V2LangToggle";
import V2Logo from "@/components/v2/ui/V2Logo";
import V2PromoBar from "@/components/v2/layout/V2PromoBar";

export default function V2Header({ v2, lang }) {
  const links = [
    { key: "home", label: v2.nav.home, href: ROUTES.home },
    // { key: "shop", label: v2.nav.shop, href: ROUTES.shop },
    { key: "categories", label: lang === "bn" ? "ক্যাটাগরি" : "Categories", href: ROUTES.categories },
    { key: "picks", label: v2.nav.picks, href: ROUTES.picks },
    { key: "lookbook", label: v2.nav.lookbook, href: ROUTES.lookbook },
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