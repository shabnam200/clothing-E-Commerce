import V2Hero from "@/components/v2/home/V2Hero";
import V2Categories from "@/components/v2/home/V2Categories";
import V2Products from "@/components/v2/home/V2Products";
import V2Lookbook from "@/components/v2/home/V2Lookbook";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import { getActiveCampaigns, getStorefrontCreative } from "@/lib/v2/campaigns";
import { getV2Locale } from "@/lib/v2/i18n";
import { getCategories } from "@/lib/v2/catalogSource";
import { getSettings } from "@/lib/v2/settings";
export default async function V2HomePage() {
  const { v2, lang } = await getV2Locale();
  const [campaigns, categories, creative, settings] = await Promise.all([
    getActiveCampaigns(lang),
    getCategories(lang),
    getStorefrontCreative(lang),
    getSettings(),
  ]);
  const features = settings.featureToggles || {};

  return (
    <>
      {features.home_hero !== false && <V2Hero v2={v2} campaign={creative.hero} />}
      {features.home_categories !== false && <V2Categories v2={v2} lang={lang} categories={categories} />}
      {features.home_products !== false && <V2Products v2={v2} lang={lang} settings={settings} />}
      {features.home_lookbook !== false && <V2Lookbook v2={v2} lang={lang} settings={settings} />}
      {features.home_promotions !== false && <V2Promo v2={v2} lang={lang} campaigns={campaigns} placedCampaigns={creative.promos} />}
      {features.home_perks !== false && <V2Perks perks={v2.perks} title={v2.perksTitle} />}
    </>
  );
}