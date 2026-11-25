import { cache } from "react";
import { api, USE_MOCK } from "@/services";
import * as dokani from "@/services/dokani/catalog";
import { isEnabled as dokaniOn } from "@/services/dokani/config";

// Server-side catalogue access for pages. Every product screen reads through here, so mock vs real API is decided in one place (services/).
// cache() = one fetch per request, shared by generateMetadata, the page and the layout.
// Where products come from:  DOKANI_* set in .env.local -> straight from Dokani Cloud (services/dokani, server only)
//                            otherwise                    -> api.catalog (mock server, or the Laravel API when NEXT_PUBLIC_API_URL is set)
const source = () => (dokaniOn() ? dokani : api.catalog);
const fail = (what, e) => console.warn(`[catalog] ${what} failed:`, e?.message || e); // visible in the terminal running `next dev`
async function timedProductCall(label, call) {
  const startedAt = Date.now();
  try { return await call(); }
  finally {
    if (process.env.NODE_ENV === "development") {
      console.log(`[product-page-api] ${label}: ${Date.now() - startedAt}ms`);
    }
  }
}

export const getCatalog = cache(async (lang = "bn", groupingMode = "category") => {
  try { return await source().listAll({}, { lang, groupingMode }); }
  catch (e) { fail("listAll", e); return []; } // source down: render an empty shop instead of crashing the whole site
});

// The layout loads this first page on every request. Asking for "the newest products" needs the total number of products, and this
// same answer already carries it, so the newest-products lookup reuses it instead of making one more (limit=1) request.
export const BASE_LIMIT = 12;

// react cache() compares arguments by reference, and callers pass a fresh `{ page, limit }` object every time, so the same page was
// being looked up 4-5 times per request (layout, products, lookbook...). Key it by the params' JSON text so they share one result.
export const getCatalogPage = (lang = "bn", groupingMode = "category", params = {}) => loadCatalogPage(lang, groupingMode, JSON.stringify(params || {}));

const loadCatalogPage = cache(async (lang, groupingMode, paramsJson) => {
  const params = JSON.parse(paramsJson);
  try {
    const catalog = source();
    const pageParams = { ...params };
    delete pageParams.latest;
    const load = (options) => typeof catalog.listPage === "function"
      ? catalog.listPage(options, { lang, groupingMode })
      : catalog.list({ ...options, category: options.categoryId, company: options.brand }, { lang });
    let result;
    if (params.latest) {
      const filtered = pageParams.q || pageParams.categoryId || pageParams.brand;
      const first = filtered
        ? await load({ ...pageParams, page: 1, limit: 1 })
        : await load({ page: 1, limit: BASE_LIMIT }); // same request the layout makes: answered from the shared cache, no extra call
      const lastPage = Math.max(1, Math.ceil((Number(first.meta?.total) || 0) / (Number(pageParams.limit) || 24)));
      result = lastPage === 1 ? await load(pageParams) : await load({ ...pageParams, page: lastPage });
    } else {
      result = await load(pageParams);
    }
    return result;
  } catch (e) {
    fail("listPage", e);
    return { items: [], meta: { page: Number(params.page) || 1, limit: Number(params.limit) || 24, total: 0, last_page: 1 } };
  }
});

export const getCategories = cache(async (lang = "bn") => {
  try {
    // Categories should reflect the shop database. Do not seed the homepage
    // with the demo catalog when the app is otherwise running in mock mode.
    if (USE_MOCK && !dokaniOn()) {
      console.warn("[catalog] categories are not connected to a database source; configure the Dokani backend for this deployment.");
      return [];
    }
    return await source().categories({ lang });
  }
  catch (e) { console.warn(`[catalog] categories unavailable: ${e?.message || e}`); return []; }
});

// Storefront brands ({ id, name, image, isLogo, productCount, soldTotal }), best sellers first. Empty when the source has no brands.
export const getBrands = cache(async () => {
  const s = source();
  if (typeof s.brands !== "function") return [];
  try { return await s.brands(); }
  catch (e) { console.warn(`[catalog] brands unavailable: ${e?.message || e}`); return []; }
});

export const getProduct = cache(async (id, lang = "bn", groupingMode = "category") => {
  // Keep an upstream outage distinct from a genuinely missing product. Pages
  // use a null result to render a real 404, so swallowing fetch errors here
  // incorrectly turns Dokani connectivity problems into "product not found".
  return timedProductCall(`product id=${id}`, () => source().get(id, { lang, groupingMode }));
});

export const getCatalogProducts = cache(async (ids, lang = "bn", groupingMode = "category") => {
  const uniqueIds = [...new Set((Array.isArray(ids) ? ids : []).filter((id) => id != null).map(String))];
  return (await Promise.all(uniqueIds.map((id) => getProduct(id, lang, groupingMode)))).filter(Boolean);
});

export const getRelated = cache(async (id, lang = "bn", limit = 4, groupingMode = "category") => {
  try { return await timedProductCall(`related products id=${id}`, () => source().related(id, { lang, limit, groupingMode })); }
  catch (e) { fail("related", e); return []; }
});
