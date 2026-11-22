import { notFound } from "next/navigation";
import V2Hero from "@/components/v2/home/V2Hero";
import V2Categories from "@/components/v2/home/V2Categories";
import V2Brands from "@/components/v2/home/V2Brands";
import V2Products from "@/components/v2/home/V2Products";
import V2Lookbook from "@/components/v2/home/V2Lookbook";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import V2TrustStrip from "@/components/v2/home/V2TrustStrip";
import V2FeaturedCollection from "@/components/v2/home/V2FeaturedCollection";
import V2StyleEdits from "@/components/v2/home/V2StyleEdits";
import V2Newsletter from "@/components/v2/home/V2Newsletter";
import V2About from "@/components/v2/home/V2About";
import V2PromoBanner from "@/components/v2/home/V2PromoBanner";
import V2WishlistView from "@/components/v2/cart/V2WishlistView";
import V2CartView from "@/components/v2/cart/V2CartView";
import V2AccountDashboard from "@/components/v2/account/V2AccountDashboard";
import V2OutfitBuilder from "@/components/v2/outfit/V2OutfitBuilder";
import V2SupportView from "@/components/v2/support/V2SupportView";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import { getActiveCampaigns, getStorefrontCreative } from "@/lib/v2/campaigns";
import { getV2Locale } from "@/lib/v2/i18n";
import { getBrands, getCatalog, getCategories } from "@/lib/v2/catalogSource";
import { getSettings } from "@/lib/v2/settings";

const normalizePages = (value) => (Array.isArray(value) ? value : []);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { lang } = await getV2Locale();
  const settings = await getSettings();
  const page = normalizePages(settings.customPages).find((item) => item.published && item.slug === slug);
  if (!page) return {};
  return {
    title: page.title?.[lang] || page.title?.en || page.slug,
  };
}

export default async function CustomPage({ params }) {
  const { slug } = await params;
  const { v2, lang } = await getV2Locale();
  const [settings, categories, brands, catalog, campaigns, creative] = await Promise.all([
    getSettings(),
    getCategories(lang),
    getBrands(),
    getCatalog(lang),
    getActiveCampaigns(lang),
    getStorefrontCreative(lang),
  ]);
  const page = normalizePages(settings.customPages).find((item) => item.published && item.slug === slug);
  if (!page) notFound();

  const pageSections = normalizePages(page.sections);
  const sections = pageSections
    .filter((section) => section && typeof section === "object" && section.enabled !== false)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

  const sectionUi = {
    hero: () => <V2Hero v2={v2} campaign={creative.hero} highlights={settings.homepageHighlights?.[lang] || []} />,
    gender_carousel: () => <V2Categories v2={v2} lang={lang} categories={categories} showCategories={false} />,
    categories: (section) => <V2Categories v2={v2} lang={lang} categories={categories} titleOverride={section.title?.[lang] || ""} showGender={false} />,
    brands: (section) => <V2Brands v2={v2} lang={lang} brands={brands} titleOverride={section.title?.[lang] || ""} />,
    products: () => <V2Products v2={v2} lang={lang} settings={settings} />,
    lookbook: (section) => <V2Lookbook v2={v2} lang={lang} settings={settings} titleOverride={section.title?.[lang] || ""} />,
    promotions: (section) => <V2Promo v2={v2} lang={lang} campaigns={campaigns} placedCampaigns={creative.promos} sectionTitle={section.title?.[lang] || ""} />,
    perks: (section) => <V2Perks perks={v2.perks} title={section.title?.[lang] || v2.perksTitle} />,
    trust_strip: () => <V2TrustStrip v2={v2} />,
    featured_collection: () => <V2FeaturedCollection v2={v2} />,
    style_edits: () => <V2StyleEdits v2={v2} />,
    newsletter: () => <V2Newsletter copy={v2.news} />,
    about: () => <V2About v2={v2} />,
    promo_banner: () => <V2PromoBanner v2={v2} />,
    wishlist: () => <div className="v2-wrap v2-page"><V2WishlistView copy={v2.wishlist} /></div>,
    cart: () => <div className="v2-wrap v2-page"><V2CartView copy={v2.cart} /></div>,
    account: () => <V2AccountDashboard copy={v2.returns} referral={v2.referral} account={v2.account} track={v2.orderTrack} />,
    shop_catalog: () => <V2ProductGrid items={catalog} wrap />,
    outfit_builder: () => settings.featureToggles?.build_a_look === false ? null : <V2OutfitBuilder />,
    support: () => <V2SupportView copy={v2.support} />,
  };

  return (
    <div className="v2-home v2-custom-page">
      {sections.map((section, index) => (
        <div key={`${section.id || section.type}-${index}`} className={`v2-home-section v2-home-section--${section.type}`}>
          {sectionUi[section.type]?.(section) || null}
        </div>
      ))}
    </div>
  );
}
