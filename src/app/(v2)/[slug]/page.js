import { notFound } from "next/navigation";
import V2Hero from "@/components/v2/home/V2Hero";
import V2Categories from "@/components/v2/home/V2Categories";
import V2Brands from "@/components/v2/home/V2Brands";
import V2Products from "@/components/v2/home/V2Products";
import V2Lookbook from "@/components/v2/home/V2Lookbook";
import V2Promo from "@/components/v2/home/V2Promo";
import V2Perks from "@/components/v2/home/V2Perks";
import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import { getActiveCampaigns, getStorefrontCreative } from "@/lib/v2/campaigns";
import { getV2Locale } from "@/lib/v2/i18n";
import { getBrands, getCategories } from "@/lib/v2/catalogSource";
import { getSettings } from "@/lib/v2/settings";

const normalizePages = (value) => (Array.isArray(value) ? value : []);
const CUSTOM_PAGE_SECTION_TYPES = new Set(["page_banner", "hero", "categories", "brands", "products", "lookbook", "promotions", "perks"]);

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
  const [settings, categories, brands, campaigns, creative] = await Promise.all([
    getSettings(),
    getCategories(lang),
    getBrands(),
    getActiveCampaigns(lang),
    getStorefrontCreative(lang),
  ]);
  const page = normalizePages(settings.customPages).find((item) => item.published && item.slug === slug);
  if (!page) notFound();

  const pageSections = normalizePages(page.sections);
  const sections = pageSections
    .filter((section) => CUSTOM_PAGE_SECTION_TYPES.has(section?.type))
    .filter((section) => section.enabled !== false)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));

  const sectionUi = {
    page_banner: (section) => {
      const title = section.title?.[lang] || page.title?.[lang] || page.title?.en || page.slug;
      return <V2PageBanner title={title} crumbs={[{ label: v2.shop.home, href: "/" }, { label: title }]} />;
    },
    hero: () => <V2Hero v2={v2} titleOverride={page.title?.[lang] || page.title?.en || page.slug} />,
    categories: (section) => <V2Categories v2={v2} lang={lang} categories={categories} titleOverride={section.title?.[lang] || ""} showGender={false} useCatalogFallback={false} />,
    brands: (section) => <V2Brands v2={v2} lang={lang} brands={brands} titleOverride={section.title?.[lang] || ""} />,
    products: () => <V2Products v2={v2} lang={lang} settings={settings} />,
    lookbook: (section) => <V2Lookbook v2={v2} lang={lang} settings={settings} titleOverride={section.title?.[lang] || ""} />,
    promotions: (section) => <V2Promo v2={v2} lang={lang} campaigns={campaigns} placedCampaigns={creative.promos} sectionTitle={section.title?.[lang] || ""} />,
    perks: (section) => <V2Perks perks={v2.perks} title={section.title?.[lang] || v2.perksTitle} />,
  };

  return (
    <div className="v2-home v2-custom-page">
      {sections.length ? sections.map((section) => (
        <div key={section.id || section.type} className={`v2-home-section v2-home-section--${section.type}`}>
          {sectionUi[section.type]?.(section) || null}
        </div>
      )) : <>
        <section className="v2-wrap v2-block v2-custom-page__empty">
          <h1 className="v2-display v2-h2">{page.title?.[lang] || page.title?.en || page.slug}</h1>
        </section>
        <V2Products v2={v2} lang={lang} settings={settings} />
      </>}
    </div>
  );
}
