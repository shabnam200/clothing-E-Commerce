import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import V2InfoView from "@/components/v2/info/V2InfoView";
import { notFound } from "next/navigation";
import { ROUTES } from "@/config/v2";
import { getV2Locale } from "@/lib/v2/i18n";

// One page template for the footer links (contact, shipping, returns, size guide, FAQ, story, privacy, terms).
// Copy lives in messages/v2/info-en.js and info-bn.js; replace with CMS / API content later.
export async function generateMetadata({ params }) {
  const { v2 } = await getV2Locale();
  const slug = (await params).slug;
  const page = Object.hasOwn(v2.info.pages, slug) ? v2.info.pages[slug] : null;
  return page ? { title: { absolute: `${page.title} — AVENOR` } } : {};
}

export default async function InfoPage({ params }) {
  const { v2 } = await getV2Locale();
  const slug = (await params).slug;
  if (!Object.hasOwn(v2.info.pages, slug)) notFound();
  const page = v2.info.pages[slug];
  return (
    <>
      <V2PageBanner title={page.title} crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: page.title }]} />
      <V2InfoView slug={slug} info={v2.info} />
    </>
  );
}
