import { NextResponse } from "next/server";
import { getCatalogPage, getCatalogProducts, getCategories } from "@/lib/v2/catalogSource";
import { findCategoryByKey } from "@/lib/v2/categoryKey";
import { filterProducts, parseShopParams } from "@/lib/v2/filters";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const groupingMode = ["gender", "category", "hidden"].includes(query.mode) ? query.mode : "category";
  // ?ids=12,15,40  ->  those products in ONE browser request (the wishlist used to send one request per product)
  if (query.ids) {
    const ids = [...new Set(String(query.ids).split(",").map((id) => id.trim()).filter((id) => /^\d+$/.test(id)))].slice(0, 24);
    try { return NextResponse.json({ items: await getCatalogProducts(ids, query.lang || "bn", groupingMode) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }); }
    catch (error) {
      console.error("[storefront] Products by ids lookup failed:", error?.message || error);
      return NextResponse.json({ error: "Product service is temporarily unavailable" }, { status: 503 });
    }
  }
  const filters = parseShopParams(query, groupingMode);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(query.limit) || 24));
  const categoryTree = filters.category ? await getCategories(query.lang || "bn") : [];
  const category = filters.category ? findCategoryByKey(categoryTree, filters.category, groupingMode) : null;
  if (filters.category && !category) return NextResponse.json({ items: [], meta: { page, limit, total: 0, last_page: 1 } }); // unknown category: nothing, not "everything"
  if (category) filters.category = category.key;
  const categoryId = category?.id ?? null;
  const pageResult = await getCatalogPage(query.lang || "bn", groupingMode, { page, limit, q: filters.q, brand: filters.brand, categoryId });
  // Public catalogue data is the same for everybody: let Vercel's CDN keep it for a minute (per URL), so repeat requests are answered near the visitor.
  return NextResponse.json({ items: filterProducts(pageResult.items, filters), meta: pageResult.meta }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
}
