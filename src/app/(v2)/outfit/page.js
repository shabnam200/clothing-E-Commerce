import V2OutfitBuilder from "@/components/v2/outfit/V2OutfitBuilder";
import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import { ROUTES } from "@/config/v2";
import { LOOK_COPY } from "@/lib/v2/looks";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";
import { getCatalogPage } from "@/lib/v2/catalogSource";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  const { lang } = await getV2Locale();
  return { title: { absolute: `${(LOOK_COPY[lang] || LOOK_COPY.en).title} — AVENOR` } };
}

export default async function OutfitPage() {
  const [{ v2, lang }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  if (settings.featureToggles?.build_a_look === false) notFound();
  const t = LOOK_COPY[lang] || LOOK_COPY.en;
  // The builder needs a real choice of tops / bottoms / layers. The layout only carries a dozen products, so this page reads its own
  // 48 (one request, cached, and only when this page is opened).
  const { items: catalogItems } = await getCatalogPage(lang, settings.storefrontGrouping?.mode || "category", { page: 1, limit: 48 });
  return (
    <>
      <V2PageBanner title={t.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: t.title }]} />
      <V2OutfitBuilder catalogItems={catalogItems} />
    </>
  );
}
