import Link from "next/link";
import { notFound } from "next/navigation";
import V2ProductDetail from "@/components/v2/shop/V2ProductDetail";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import { BRAND, FREE_DELIVERY_OVER, ROUTES } from "@/config/v2";
import { buildCatalog, findProduct, relatedProducts } from "@/lib/v2/catalog";
import { shopHref } from "@/lib/v2/filters";
import { getV2Locale } from "@/lib/v2/i18n";
import { fmtPrice } from "@/lib/v2/format";

export async function generateMetadata({ params }) {
  const { v2, lang } = await getV2Locale();
  const p = findProduct(buildCatalog(v2, lang), (await params).id);
  return p ? { title: { absolute: `${p.name} — ${BRAND.name}` }, description: p.description } : {};
}

export default async function ProductPage({ params }) {
  const { v2, lang } = await getV2Locale();
  const catalog = buildCatalog(v2, lang);
  const p = findProduct(catalog, (await params).id);
  if (!p) notFound();
  const c = v2.product;
  const perks = c.perks.map((t) => t.replace("{amount}", fmtPrice(FREE_DELIVERY_OVER, lang)));
  return (
    <div className="v2-wrap v2-page">
      <nav className="v2-crumbs" aria-label="Breadcrumb">
        <Link href={ROUTES.home}>{v2.shop.home}</Link><span aria-hidden="true">/</span>
        <Link href={ROUTES.shop}>{v2.shop.title}</Link><span aria-hidden="true">/</span>
        <Link href={shopHref({ category: p.category })}>{p.categoryLabel}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>
      <V2ProductDetail p={p} copy={c} perks={perks} />
      <section className="v2-related" aria-labelledby="v2-related-title">
        <h2 id="v2-related-title" className="v2-display v2-h2">{c.related}</h2>
        <V2ProductGrid items={relatedProducts(catalog, p, 4)} />
      </section>
    </div>
  );
}
