import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import Link from "next/link";
import { notFound } from "next/navigation";
import V2ProductDetail from "@/components/v2/shop/V2ProductDetail";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import V2DeadlineBadge from "@/components/v2/campaign/V2DeadlineBadge";
import { getActiveCampaign } from "@/lib/v2/campaigns";
import { BRAND, ROUTES } from "@/config/v2";
import { getProduct, getRelated } from "@/lib/v2/catalogSource";
import { shopHref } from "@/lib/v2/filters";
import { getV2Locale } from "@/lib/v2/i18n";
import { getSettings } from "@/lib/v2/settings";

async function logApiDuration(label, call) {
  const startedAt = Date.now();
  try { return await call(); }
  finally { console.log(`[product-page-api] ${label}: ${Date.now() - startedAt}ms`); }
}

export async function generateMetadata({ params }) {
  const [{ lang }, settings] = await Promise.all([getV2Locale(), getSettings()]);
  const brandName = lang === "bn" && settings.brandNameBn ? settings.brandNameBn : settings.brandNameEn || BRAND.name;
  const id = (await params).id;
  const p = await logApiDuration(`metadata product id=${id}`, () => getProduct(id, lang, settings.storefrontGrouping?.mode || "category"));
  return p ? { title: { absolute: `${p.name} — ${brandName}` }, description: p.description } : {};
}

export default async function ProductPage({ params }) {
  const { v2, lang } = await getV2Locale();
  const id = (await params).id;
  const settings = await getSettings();
  const groupingMode = settings.storefrontGrouping?.mode || "category";
  // product, related products and the live campaign do not depend on each other: ask for all three at once (was one after another)
  const [p, related, campaign] = await Promise.all([
    logApiDuration(`product id=${id}`, () => getProduct(id, lang, groupingMode)),
    logApiDuration(`related products id=${id}`, () => getRelated(id, lang, 4, groupingMode)),
    getActiveCampaign(lang),
  ]);
  if (!p) notFound();
  const c = v2.product;
  const campaignBadge = campaign?.badge ? <div className="v2-pd__camp"><V2DeadlineBadge {...campaign.badge} /></div> : null;
  return (
    <>
      <V2PageBanner crumbs={[{ label: v2.shop.home, href: ROUTES.home }, { label: v2.shop.title, href: ROUTES.shop }, { label: p.categoryLabel, href: shopHref({ category: p.category }) }, { label: p.name }]} />
      <div className="v2-wrap v2-page">
      <V2ProductDetail p={p} copy={c} campaignBadge={campaignBadge} />
      <section className="v2-related" aria-labelledby="v2-related-title">
        <h2 id="v2-related-title" className="v2-display v2-h2">{c.related}</h2>
        <V2ProductGrid items={related} />
      </section>
      </div>
    </>
  );
}
