import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2InfoView from "@/components/v2/info/V2InfoView";
import { notFound, redirect } from "next/navigation";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";
import { fillTokens, settingTokens } from "@/lib/v2/tokens";

// Owner-managed pages override the bilingual defaults stored in the storefront settings API.
const getInfoPage = (info, infoPages, lang, slug, settings) => {
  const fallback = info.pages[slug];
  const custom = infoPages?.[lang]?.[slug];
  return fallback && custom && typeof custom.title === "string" && typeof custom.lead === "string" && Array.isArray(custom.blocks)
    ? { ...fallback, ...fillTokens(custom, settingTokens(settings, lang)) }
    : fallback;
};

export async function generateMetadata({ params }) {
  const [{ v2, lang }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  const slug = (await params).slug;
  const page = getInfoPage(v2.info, settings.infoPages, lang, slug, settings);
  return page ? { title: { absolute: `${page.title} — AVENOR` } } : {};
}

export default async function InfoPage({ params }) {
  const [{ v2, lang }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  const slug = (await params).slug;
  if (slug === "story") notFound();
  if (slug === "contact") redirect(ROUTES.support); // old /info/contact links land on the support page
  const page = getInfoPage(v2.info, settings.infoPages, lang, slug, settings);
  if (!page) notFound();
  const info = { ...v2.info, pages: { ...v2.info.pages, [slug]: page } };
  return (
    <>
      <V2PageBanner title={page.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: page.title }]} />
      <V2InfoView slug={slug} info={info} support={settings.support} />
    </>
  );
}
