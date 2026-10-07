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
      
      <header className="v2-shophead" style={{ marginBottom: '30px' }}>
        <div>
          <p className="v2-eyebrow">{s.eyebrow}</p>
          <h1 className="v2-display v2-h2">{title}</h1>
        </div>
        <p className="v2-shophead__count" role="status">{countText}</p>
      </header>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        <aside style={{ flex: '0 0 260px', width: '100%', position: 'sticky', top: '90px' }}>
          {/* FIXED: Passing clean object to avoid Server-Client function errors */}
          <V2ShopFilters cats={{ names: v2.cats.names, genders: v2.cats.genders }} f={f} />
        </aside>

        <main style={{ flex: '1 1 600px', minWidth: 0 }}>
          <div className="v2-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--v2-line)' }}>
            {active ? <Link scroll={false} href={ROUTES.shop} className="v2-textbtn" style={{ fontWeight: 600 }}>{s.clear}</Link> : <span />}
            <V2SortSelect label={s.sortLabel} value={f.sort} f={f} options={SORTS.map((value) => ({ value, label: s.sorts[value] }))} />
          </div>

          {items.length ? (
            <V2ProductGrid items={items} />
          ) : (
            <V2EmptyState icon={<FiSearch />} title={s.emptyTitle} text={s.emptyText}>
              <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{s.emptyCta}</Link>
            </V2EmptyState>
          )}
        </main>
      </div>

    </div>
  );
}