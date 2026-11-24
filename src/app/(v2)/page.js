import V2Hero from "@/components/v2/home/V2Hero";
import V2Categories from "@/components/v2/home/V2Categories";
import V2Brands from "@/components/v2/home/V2Brands";
import V2Products from "@/components/v2/home/V2Products";
import V2Lookbook from "@/components/v2/home/V2Lookbook";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import { getActiveCampaigns, getStorefrontCreative } from "@/lib/v2/campaigns";
import { getV2Locale } from "@/lib/v2/i18n";
import { getBrands, getCategories } from "@/lib/v2/catalogSource";
import { getSettings } from "@/lib/v2/settings";
import { HOMEPAGE_SECTION_ORDER } from "@/config/homepage";
export default async function V2HomePage() {
  const { v2, lang } = await getV2Locale();
  const [campaigns, categories, brands, creative, settings] = await Promise.all([
    getActiveCampaigns(lang),
    getCategories(lang),
    getBrands(),
    getStorefrontCreative(lang),
    getSettings(),
  ]);
  const features = settings.featureToggles || {};
  const titles = settings.homepageSectionTitles?.[lang] || {};
  const sectionContent = {
    categories: <V2Categories v2={v2} lang={lang} categories={categories} titleOverride={titles.categories} groupingMode={settings.storefrontGrouping?.mode || "gender"} />,
    brands: <V2Brands v2={v2} lang={lang} brands={brands} titleOverride={titles.brands} />,
    products: <V2Products v2={v2} lang={lang} settings={settings} />,
    lookbook: <V2Lookbook v2={v2} lang={lang} settings={settings} titleOverride={titles.lookbook} />,
    promotions: <V2Promo v2={v2} lang={lang} campaigns={campaigns} placedCampaigns={creative.promos} sectionTitle={titles.promotions} />,
    perks: <V2Perks perks={v2.perks} title={titles.perks || v2.perksTitle} />,
  };
  const savedOrder = Array.isArray(settings.homepageSectionOrder) ? settings.homepageSectionOrder : HOMEPAGE_SECTION_ORDER;
  const sectionOrder = [...new Set(savedOrder.filter((key) => HOMEPAGE_SECTION_ORDER.includes(key))), ...HOMEPAGE_SECTION_ORDER.filter((key) => !savedOrder.includes(key))];

  return (
    <div className="v2-home">
      {features.home_hero !== false && <V2Hero v2={v2} campaign={creative.hero} />}
      {sectionOrder.map((key) => {
        const featureKey = `home_${key}`;
        return features[featureKey] === false ? null : <div key={key} className={`v2-home-section v2-home-section--${key}`}>{sectionContent[key]}</div>;
      })}
    </div>
  );
}
