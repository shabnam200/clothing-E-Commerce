import V2PageBanner from "@/components/v2/layout/V2PageBanner";
import Link from "@/components/ui/AppLink";
import { FiSearch } from "react-icons/fi";
import V2ShopFilters from "@/components/v2/shop/V2ShopFilters";
import V2SortSelect from "@/components/v2/shop/V2SortSelect";
import V2EmptyState from "@/components/v2/ui/V2EmptyState";
import V2ShopResults from "@/components/v2/shop/V2ShopResults";
import { ROUTES } from "@/config/v2";
import { getBrands, getCatalogPage, getCategories } from "@/lib/v2/catalogSource";
import { filterProducts, parseShopParams, SORTS } from "@/lib/v2/filters";
import { getV2Locale } from "@/lib/v2/i18n";
import { fmtNum } from "@/lib/v2/format";
import { getSettings } from "@/lib/v2/settings";
import { findCategoryByKey } from "@/lib/v2/categoryKey";

const EMPTY_PAGE = { items: [], meta: { page: 1, limit: 24, total: 0, last_page: 1 } };

export default async function ShopPage({ searchParams }) {
  const { v2, lang } = await getV2Locale();
  const settings = await getSettings();
  const groupingMode = settings.storefrontGrouping?.mode || "category";
  const parsed = parseShopParams(await searchParams, groupingMode);
  // With no category filter the product list does not need the category tree first, so all three are asked together.
  const [categoryTree, brands, unfilteredPage] = await Promise.all([
    getCategories(lang), getBrands(),
    parsed.category ? null : getCatalogPage(lang, groupingMode, { page: 1, limit: 24, q: parsed.q, brand: parsed.brand, categoryId: null }),
  ]);
  // ?category=skincare must open "skin-care" (see findCategoryByKey). A category that really does not exist has no products; it must not
  // fall back to "all products, then filter them away", which showed "0 products" next to a Load more button.
  const resolved = parsed.category ? findCategoryByKey(categoryTree, parsed.category, groupingMode) : null;
  const f = resolved ? { ...parsed, category: resolved.key } : parsed;
  const catalogPage = unfilteredPage || (parsed.category && !resolved ? EMPTY_PAGE : await getCatalogPage(lang, groupingMode, { page: 1, limit: 24, q: f.q, brand: f.brand, categoryId: resolved?.id ?? null }));
  const items = filterProducts(catalogPage.items, f);
  const s = v2.shop;
  const categoryName = f.category && (v2.cats.names[f.category] || resolved?.name || "");
  const parts = [f.tag && v2.products.tabs[f.tag], f.gender && v2.cats.genders[f.gender], categoryName, f.brand && brands.find((item) => item.id === f.brand)?.name].filter(Boolean);
  const title = f.q ? s.searchTitle.replace("{q}", f.q) : parts.length ? parts.join(" / ") : s.title;
  // The page holds 24 products at a time: when none of them was dropped by the filters, show the real total; while the first page has no
  // match but later pages may, show no number at all instead of "0 products".
  const moreOnLaterPages = catalogPage.meta.page < catalogPage.meta.last_page;
  const shownCount = items.length === catalogPage.items.length ? Math.max(items.length, Number(catalogPage.meta.total) || 0) : items.length;
  const countText = items.length === 0 && moreOnLaterPages ? "" : shownCount === 1 ? s.countOne : s.count.replace("{n}", fmtNum(shownCount, lang));

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

          {items.length || catalogPage.meta.page < catalogPage.meta.last_page ? (
            <V2ShopResults initialItems={items} meta={catalogPage.meta} filters={f} groupingMode={groupingMode} lang={lang} empty={
              <V2EmptyState icon={<FiSearch />} title={s.emptyTitle} text={s.emptyText}>
                <Link href={ROUTES.shop} className="v2-pill v2-pill--solid">{s.emptyCta}</Link>
              </V2EmptyState>
            } />
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
