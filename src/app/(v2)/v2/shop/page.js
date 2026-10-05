import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import V2ShopFilters from "@/components/v2/shop/V2ShopFilters";
import V2SortSelect from "@/components/v2/shop/V2SortSelect";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { ROUTES } from "@/config/v2";
import { buildCatalog } from "@/lib/v2/catalog";
import { filterProducts, parseShopParams, SORTS } from "@/lib/v2/filters";
import { getV2Locale } from "@/lib/v2/i18n";
import { fmtNum } from "@/lib/v2/format";

// Shop / listing. Everything is driven by the URL (?gender=&category=&tag=&q=&sort=), so Men/Women/Kids, categories,
// Sale/New/Best and navbar search all land here. Data comes from lib/v2/catalog.js (swap for the API later).
export default async function ShopPage({ searchParams }) {
  const { v2, lang } = await getV2Locale();
  const f = parseShopParams(await searchParams);
  const items = filterProducts(buildCatalog(v2, lang), f);
  const s = v2.shop;
  const parts = [f.tag && v2.products.tabs[f.tag], f.gender && v2.cats.genders[f.gender], f.category && v2.cats.names[f.category]].filter(Boolean);
  const title = f.q ? s.searchTitle.replace("{q}", f.q) : parts.length ? parts.join(" / ") : s.title;
  const active = Boolean(f.q || f.tag || f.gender || f.category);
  const countText = items.length === 1 ? s.countOne : s.count.replace("{n}", fmtNum(items.length, lang));

  return (
    <div className="v2-wrap v2-page">
      <nav className="v2-crumbs" aria-label="Breadcrumb">
        <Link href={ROUTES.home}>{s.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{s.title}</span>
      </nav>
      <header className="v2-shophead">
        <div>
          <p className="v2-eyebrow">{s.eyebrow}</p>
          <h1 className="v2-display v2-h2">{title}</h1>
        </div>
        <p className="v2-shophead__count" role="status">{countText}</p>
      </header>
      <V2ShopFilters v2={v2} f={f} />
      <div className="v2-toolbar">
        {active ? <Link scroll={false} href={ROUTES.shop} className="v2-textbtn">{s.clear}</Link> : <span />}
        <V2SortSelect label={s.sortLabel} value={f.sort} f={f} options={SORTS.map((value) => ({ value, label: s.sorts[value] }))} />
      </div>
      {items.length ? <V2ProductGrid items={items} /> : (
        <V2EmptyState icon={<FiSearch />} title={s.emptyTitle} text={s.emptyText}>
          <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{s.emptyCta}</Link>
        </V2EmptyState>
      )}
    </div>
  );
}
