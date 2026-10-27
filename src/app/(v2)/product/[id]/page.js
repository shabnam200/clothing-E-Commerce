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

export async function generateMetadata({ params }) {
  const { lang } = await getV2Locale();
  const p = await getProduct((await params).id, lang);
  return p ? { title: { absolute: `${p.name} — ${BRAND.name}` }, description: p.description } : {};
}

export default async function ProductPage({ params }) {
  const { v2, lang } = await getV2Locale();
  const id = (await params).id;
  const p = await getProduct(id, lang);
  if (!p) notFound();
  const related = await getRelated(id, lang, 4);
  const c = v2.product;
  const campaign = await getActiveCampaign(lang);
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
