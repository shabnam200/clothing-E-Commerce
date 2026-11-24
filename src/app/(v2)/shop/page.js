import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import V2ProductGrid from "@/components/v2/product/V2ProductGrid";
import V2ShopFilters from "@/components/v2/shop/V2ShopFilters";
import V2SortSelect from "@/components/v2/shop/V2SortSelect";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import { ROUTES } from "@/config/v2";
import { getBrands, getCatalog, getCategories } from "@/lib/v2/catalogSource";
import { filterProducts, parseShopParams, SORTS } from "@/lib/v2/filters";
import { getV2Locale } from "@/lib/v2/i18n";
import { fmtNum } from "@/lib/v2/format";
import { getSettings } from "@/lib/v2/settings";
import { categoryPathKeyForGrouping } from "@/lib/v2/categoryKey";

function findCategoryName(categories, selectedKey, groupingMode, parentKey = "") {
  for (const category of categories || []) {
    const key = categoryPathKeyForGrouping(category, parentKey, groupingMode);
    if (key === selectedKey) return category.name;
    const nested = findCategoryName(category.subs, selectedKey, groupingMode, key || parentKey);
    if (nested) return nested;
  }
  return "";
}

export default async function ShopPage({ searchParams }) {
  const { v2, lang } = await getV2Locale();
  const settings = await getSettings();
  const groupingMode = settings.storefrontGrouping?.mode || "category";
  const f = parseShopParams(await searchParams, groupingMode);
  const [catalogItems, categoryTree, brands] = await Promise.all([getCatalog(lang, groupingMode), getCategories(lang), getBrands()]);
  const items = filterProducts(catalogItems, f);
  const s = v2.shop;
  const categoryName = f.category && (v2.cats.names[f.category] || findCategoryName(categoryTree, f.category, groupingMode));
  const parts = [f.tag && v2.products.tabs[f.tag], f.gender && v2.cats.genders[f.gender], categoryName, f.brand && brands.find((item) => item.id === f.brand)?.name].filter(Boolean);
  const title = f.q ? s.searchTitle.replace("{q}", f.q) : parts.length ? parts.join(" / ") : s.title;
  const countText = items.length === 1 ? s.countOne : s.count.replace("{n}", fmtNum(items.length, lang));

  return (
    <>
    <V2PageBanner title={title} crumbs={[{ label: s.home, href: ROUTES.home }, { label: s.title, href: parts.length || f.q ? ROUTES.shop : undefined }, ...(parts.length || f.q ? [{ label: title }] : [])]}>
      <p role="status">{countText}</p>
    </V2PageBanner>
    <div className="v2-wrap v2-page">

      <div className="v2-shop-layout">
        
        <aside className="v2-shop-layout__filters">
          {/* FIXED: Passing clean object to avoid Server-Client function errors */}
          <V2ShopFilters cats={{ names: v2.cats.names, genders: v2.cats.genders }} categoryTree={categoryTree} groupingMode={groupingMode} brands={brands.map(({ id, name, productCount }) => ({ id, name, productCount }))} brandsTitle={v2.brands.filterTitle} f={f} resultCount={items.length} />
        </aside>

        <div className="v2-shop-layout__results">
          <div className="v2-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--v2-line)' }}>
            <V2SortSelect label={s.sortLabel} value={f.sort} f={f} options={SORTS.map((value) => ({ value, label: s.sorts[value] }))} />
          </div>

          {items.length ? (
            <V2ProductGrid items={items} wrap />
          ) : (
            <V2EmptyState icon={<FiSearch />} title={s.emptyTitle} text={s.emptyText}>
              <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{s.emptyCta}</Link>
            </V2EmptyState>
          )}
        </div>
      </div>

    </div>
    </>
  );
}
