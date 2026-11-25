import { NextResponse } from "next/server";
import { getCatalogPage, getCatalogProducts, getCategories } from "@/lib/v2/catalogSource";
import { categoryPathKeyForGrouping } from "@/lib/v2/categoryKey";
import { filterProducts, parseShopParams } from "@/lib/v2/filters";

export const dynamic = "force-dynamic";

function findCategoryId(rows, selectedKey, mode, parentKey = "") {
  for (const category of rows || []) {
    const key = categoryPathKeyForGrouping(category, parentKey, mode);
    if (key === selectedKey) return category.id;
    const nested = findCategoryId(category.subs, selectedKey, mode, key || parentKey);
    if (nested) return nested;
  }
  return null;
}

export async function GET(request) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const groupingMode = ["gender", "category", "hidden"].includes(query.mode) ? query.mode : "category";
  // ?ids=12,15,40  ->  those products in ONE browser request (the wishlist used to send one request per product)
  if (query.ids) {
    const ids = [...new Set(String(query.ids).split(",").map((id) => id.trim()).filter((id) => /^\d+$/.test(id)))].slice(0, 24);
    try { return NextResponse.json({ items: await getCatalogProducts(ids, query.lang || "bn", groupingMode) }); }
    catch (error) {
      console.error("[storefront] Products by ids lookup failed:", error?.message || error);
      return NextResponse.json({ error: "Product service is temporarily unavailable" }, { status: 503 });
    }
  }
  const filters = parseShopParams(query, groupingMode);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(query.limit) || 24));
  const categoryTree = filters.category ? await getCategories(query.lang || "bn") : [];
  const categoryId = filters.category ? findCategoryId(categoryTree, filters.category, groupingMode) : null;
  const pageResult = await getCatalogPage(query.lang || "bn", groupingMode, { page, limit, q: filters.q, brand: filters.brand, categoryId });
  return NextResponse.json({ items: filterProducts(pageResult.items, filters), meta: pageResult.meta });
}
