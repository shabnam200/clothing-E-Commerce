import { BRAND, ROUTES } from "@/config/v2";
import V2HeaderShell from "./V2HeaderShell";
import V2LangToggle from "./V2LangToggle";
import V2Logo from "@/components/v2/ui/V2Logo";
import V2PromoBar from "@/components/v2/layout/V2PromoBar";
import V2CampaignBar from "@/components/v2/campaign/V2CampaignBar";

export default function V2Header({ v2, lang, languageMode = "both", settings = {}, campaign = null, offer = null }) {
  const menu = settings.homepageMenu || {};
  const customLabel = (key, fallback) => menu[key]?.[lang] || fallback;
  const links = [
    { key: "home", label: customLabel("home", v2.nav.home), href: ROUTES.home },
    // { key: "shop", label: v2.nav.shop, href: ROUTES.shop },
    { key: "categories", label: customLabel("categories", lang === "bn" ? "ক্যাটাগরি" : "Categories"), href: ROUTES.categories },
    { key: "picks", label: customLabel("picks", v2.nav.picks), href: ROUTES.picks },
    { key: "lookbook", label: customLabel("lookbook", v2.nav.lookbook), href: ROUTES.lookbook },
    { key: "outfit", label: customLabel("outfit", lang === "bn" ? "লুক বানান" : "Build a Look"), href: ROUTES.outfit },
  ];

  const featureToggles = settings.featureToggles || {};
  const visibleLinks = links.filter((link) => menu[link.key]?.visible !== false && (link.key !== "outfit" || featureToggles.build_a_look !== false));
  const customLinks = (Array.isArray(settings.customPages) ? settings.customPages : [])
    .filter((page) => page?.published && page?.showInMenu && page?.slug)
    .sort((a, b) => Number(a.menuOrder || 0) - Number(b.menuOrder || 0))
    .map((page) => ({
      key: `custom-${page.slug}`,
      label: page.menuLabel?.[lang] || page.title?.[lang] || page.slug,
      href: `/${encodeURIComponent(page.slug)}`,
    }));
  const allLinks = [...visibleLinks, ...customLinks];
  const brandName = lang === "bn" && settings.brandNameBn ? settings.brandNameBn : settings.brandNameEn || BRAND.name;
  const toggle = languageMode === "both" ? <V2LangToggle lang={lang} label={v2.nav.lang} ariaLabel={v2.nav.langAria} /> : null;
  const announcementBar = offer
    ? <V2PromoBar offer={offer} />
    : campaign
      ? <V2CampaignBar campaign={campaign} />
      : <V2PromoBar />;

  return (
    <V2HeaderShell
      links={allLinks}
      nav={v2.nav}
      search={v2.search}
      logo={<V2Logo name={brandName} logoUrl={settings.siteLogoUrl || BRAND.logo} />}
      lang={toggle}
      settings={settings}
      announcementBar={announcementBar}
      showWishlist={featureToggles.wishlist !== false}
      showMiniCart={featureToggles.mini_cart !== false}
    />
  );
}
