// AVENOR catalogue read straight from Dokani Cloud (server only). Same method names as api.catalog in services/, so
// lib/v2/catalogSource.js can use either. Products are cached in memory for CATALOG_TTL_MS.
import { assertShop, clearDokaniCache, dokaniGet } from "./client";
import { CATALOG_TTL_MS, cfg } from "./config";
import { isClothingProduct, isSellable, mapProduct, storefrontImageUrl } from "./mapper";
import { categoryPathKey, categoryPathKeyForGrouping } from "@/lib/v2/categoryKey";

const PER_PAGE = 100;
const PRODUCT_TTL_MS = 3 * 60 * 1000; // product pages / lists / related: shared by all visitors for 3 min, then refreshed in the background
let cache = { at: 0, rows: null, pending: null };
let categoryCache = { at: 0, rows: null, pending: null };
let campaignCache = { at: 0, discounts: null, pending: null };
let brandCache = { at: 0, rows: null, pending: null };

export function clearCatalogCache() {
  clearDokaniCache();
  cache = { at: 0, rows: null, pending: null };
  categoryCache = { at: 0, rows: null, pending: null };
  campaignCache = { at: 0, discounts: null, pending: null };
  brandCache = { at: 0, rows: null, pending: null };
}

async function campaignDiscounts() {
  if (campaignCache.discounts && Date.now() - campaignCache.at < CATALOG_TTL_MS) return campaignCache.discounts;
  if (!campaignCache.pending) {
    campaignCache.pending = dokaniGet("/campaigns", {}, { ttl: CATALOG_TTL_MS }) // same cached answer lib/v2/campaigns.js uses: one /campaigns call, not two
      .then((json) => {
        const rows = Array.isArray(json) ? json : json?.campaigns ?? json?.data ?? [];
        const discounts = new Map();
        for (const campaign of rows) {
          if (!campaign || !["1", "true"].includes(String(campaign.status).toLowerCase()) || !campaign.discount_type || !(Number(campaign.discount_value) > 0)) continue;
          let ids = campaign.product_ids;
          if (typeof ids === "string") { try { ids = JSON.parse(ids); } catch { ids = []; } }
          if (!Array.isArray(ids)) continue;
          for (const id of ids) if (!discounts.has(String(id))) discounts.set(String(id), { type: campaign.discount_type, value: Number(campaign.discount_value), campaign_id: campaign.id, campaign_title: campaign.title_en || campaign.title_bn || campaign.title || "" });
        }
        campaignCache = { at: Date.now(), discounts, pending: null };
        return discounts;
      })
      .catch(() => { campaignCache.pending = null; return campaignCache.discounts || new Map(); });
  }
  if (campaignCache.discounts) { campaignCache.pending.catch(() => {}); return campaignCache.discounts; } // stale copy now, refresh in background
  return campaignCache.pending;
}

async function withCampaignDiscount(product) {
  const discount = (await campaignDiscounts()).get(String(product.id));
  return discount ? { ...product, campaign_discount_type: discount.type, campaign_discount_value: discount.value, campaign_id: discount.campaign_id, campaign_title: discount.campaign_title } : product;
}

async function categoryRows() {
  if (categoryCache.rows && Date.now() - categoryCache.at < CATALOG_TTL_MS) return categoryCache.rows;
  if (!categoryCache.pending) {
    categoryCache.pending = dokaniGet("/shops/category")
      .then((j) => Array.isArray(j.category) ? j.category : j.category?.data ?? [])
      .then((rows) => { assertShop(rows); categoryCache = { at: Date.now(), rows, pending: null }; return rows; })
      .catch((error) => { categoryCache.pending = null; throw error; });
  }
  if (categoryCache.rows) { categoryCache.pending.catch(() => {}); return categoryCache.rows; }
  return categoryCache.pending;
}

function genderKey(category) {
  const value = `${category?.slug ?? ""} ${category?.name ?? ""}`.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  if (/\b(women|woman|female|ladies)\b/.test(value)) return "women";
  if (/\b(men|man|male)\b/.test(value)) return "men";
  if (/\b(kids|kid|children|boys|girls)\b/.test(value)) return "kids";
  return null;
}

async function storefrontRows(rows, groupingMode = "category") {
  try {
    const roots = await categoryRows();
    const byId = new Map();
    const addTree = (node, gender, parentKey = "", parentPath = []) => {
      if (Number(node.status ?? 1) !== 1 || node.visible === false) return;
      const key = groupingMode === "category" ? categoryPathKeyForGrouping(node, parentKey, "category") : categoryPathKey(node, parentKey);
      if (!key) return;
      const pathKeys = [...parentPath, key];
      byId.set(String(node.id), { key, gender, pathKeys });
      for (const nested of node.subs || []) addTree(nested, gender, key, pathKeys);
    };
    for (const root of roots) {
      if (Number(root.status ?? 1) !== 1 || root.visible === false) continue;
      if (groupingMode === "category") addTree(root, null);
      else {
        const gender = genderKey(root);
        if (gender) for (const child of root.subs || []) addTree(child, gender);
      }
    }
    return rows.map((product) => {
      const row = groupingMode === "category" ? { ...product, storefront_grouping_mode: "category" } : product;
      const categoryId = row.sub_category_id || row.category_id || row.category?.id;
      const category = byId.get(String(categoryId));
      return category ? { ...row, storefront_category_key: category.key, storefront_category_path_keys: category.pathKeys, storefront_gender_key: category.gender } : row;
    });
  } catch (error) {
    console.warn("[catalog] Could not load category tree for storefront product mapping.", error?.message || error);
    return rows;
  }
}
// GET /shops/products, page by page. A plain-array answer that is shorter than PER_PAGE is the last page.
async function fetchAllRows() {
  const all = [];
  let firstId = null;
  for (let page = 1; page <= 30; page++) {
    // Ask for storefront rows: the API uses this flag to apply web visibility
    // and to withhold prices for products the shop marked price-hidden.
    const j = await dokaniGet("/shops/products", { per_page: PER_PAGE, page, web_visible: 1 });
    const box = j.products;
    const rows = Array.isArray(box) ? box : Array.isArray(box?.data) ? box.data : [];
    if (rows.length === 0 || (page > 1 && rows[0]?.id === firstId)) break; // empty page, or the API ignores "page" and repeats itself
    firstId = firstId ?? rows[0]?.id;
    all.push(...rows);
    const hasNext = !Array.isArray(box) && (box?.links || []).some((l) => l.label === "Next" && l.url);
    if (!hasNext && rows.length < PER_PAGE) break;
  }
  return all;
}

async function rawRows() {
  if (cache.rows && Date.now() - cache.at < CATALOG_TTL_MS) return cache.rows;
  if (!cache.pending) {
    cache.pending = fetchAllRows()
      .then((rows) => { assertShop(rows); cache = { at: Date.now(), rows, pending: null }; return rows; })
      .catch((e) => { cache.pending = null; if (cache.rows && /timeout|aborted/i.test(e?.message || "")) { console.warn("[catalog] Refresh timed out; serving the last successful catalog.", e?.message || e); return cache.rows; } throw e; });
  }
  if (cache.rows) { cache.pending.catch(() => {}); return cache.rows; }
  return cache.pending;
}

// Raw Dokani rows are server-only and used by checkout to resolve variant IDs
// and prices from the trusted catalogue, never from browser-submitted prices.
export async function getRawProduct(id, groupingMode = "category", { fresh = false } = {}) {
  let raw = null;
  try {
    const json = await dokaniGet(`/shops/products/${encodeURIComponent(id)}`, {}, { ttl: fresh ? 0 : PRODUCT_TTL_MS });
    raw = json?.product ?? json?.data ?? json;
  } catch (error) {
    // Some Dokani deployments expose the product in the paginated storefront
    // list but do not expose GET /shops/products/{id}.
    if (error?.status !== 404) throw error;
  }

  let rows = await storefrontRows(raw ? [raw] : [], groupingMode);
  let product = rows.find((p) => String(p.id) === String(id) && isSellable(p) && (groupingMode === "category" || isClothingProduct(p))) ?? null;
  // Old fallback: when the product was not found it downloaded EVERY product (100 per page, many requests) to look for it. That made
  // each wrong / hidden / sold-out product URL (and every crawler hit) cost 10+ backend calls. This backend has GET /products/{id},
  // so it is off. Set DOKANI_PRODUCT_LIST_FALLBACK=1 only for a deployment that really cannot read a single product.
  if (!product && process.env.DOKANI_PRODUCT_LIST_FALLBACK === "1") {
    const listed = (await rawRows()).find((p) => String(p.id) === String(id) && isSellable(p));
    if (listed) {
      rows = await storefrontRows([listed], groupingMode);
      product = rows.find((p) => String(p.id) === String(id) && (groupingMode === "category" || isClothingProduct(p))) ?? null;
    }
  }
  return product ? withCampaignDiscount(product) : null;
}

export async function listAll(_params = {}, { lang = "bn", groupingMode = "category" } = {}) {
  const products = await storefrontRows(await rawRows(), groupingMode);
  const rows = products.filter((p) => isSellable(p) && (groupingMode === "category" || isClothingProduct(p)));
  const discounts = await campaignDiscounts();
  const now = Date.now();
  return rows.map((p, i) => {
    const discount = discounts.get(String(p.id));
    const source = discount ? { ...p, campaign_discount_type: discount.type, campaign_discount_value: discount.value, campaign_id: discount.campaign_id, campaign_title: discount.campaign_title } : p;
    return mapProduct(source, lang, i, now);
  });
}
export async function list(params = {}, opts = {}) { const items = await listAll(params, opts); return { items, meta: { page: 1, limit: items.length, total: items.length, last_page: 1 } }; }
export async function listPage(params = {}, { lang = "bn", groupingMode = "category" } = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 24));
  const query = { per_page: limit, page, web_visible: 1 };
  if (params.q) query.search = params.q;
  if (params.categoryId) query.category = params.categoryId;
  if (params.brand) query.company = params.brand;
  const json = await dokaniGet("/shops/products", query, { ttl: PRODUCT_TTL_MS });
  const box = json.products;
  const rawRows = Array.isArray(box) ? box : Array.isArray(box?.data) ? box.data : [];
  const products = await storefrontRows(rawRows, groupingMode);
  const rows = products.filter((product) => isSellable(product) && (groupingMode === "category" || isClothingProduct(product)));
  const discounts = await campaignDiscounts();
  const now = Date.now();
  const items = rows.map((product, index) => {
    const discount = discounts.get(String(product.id));
    const source = discount ? { ...product, campaign_discount_type: discount.type, campaign_discount_value: discount.value, campaign_id: discount.campaign_id, campaign_title: discount.campaign_title } : product;
    return mapProduct(source, lang, (page - 1) * limit + index, now);
  });
  const pagination = json.pagination ?? box?.meta ?? {};
  const total = Number(pagination.total) || rawRows.length;
  const lastPage = Number(pagination.last_page) || (rawRows.length < limit ? page : page + 1);
  return { items, meta: { page, limit, total, last_page: lastPage } };
}

export async function get(id, { lang = "bn", groupingMode = "category" } = {}) {
  const product = await getRawProduct(id, groupingMode);
  return product ? mapProduct(product, lang) : null;
}
export async function related(id, { limit = 4, lang = "bn", groupingMode = "category" } = {}) {
  const json = await dokaniGet(`/storefront/products/${encodeURIComponent(id)}/related`, { limit }, { ttl: PRODUCT_TTL_MS });
  const related = Array.isArray(json?.items) ? json.items : Array.isArray(json?.products) ? json.products : Array.isArray(json?.data) ? json.data : [];
  const rows = await storefrontRows(related, groupingMode);
  return Promise.all(rows.slice(0, limit).map(async (product, index) => mapProduct(await withCampaignDiscount(product), lang, index)));
}
async function brandRows() {
  if (brandCache.rows && Date.now() - brandCache.at < CATALOG_TTL_MS) return brandCache.rows;
  if (!brandCache.pending) {
    brandCache.pending = dokaniGet("/storefront/brands")
      .then((json) => {
        const rows = Array.isArray(json?.brands) ? json.brands : [];
        assertShop(rows);
        brandCache = { at: Date.now(), rows, pending: null };
        return rows;
      })
      .catch((error) => { brandCache = { at: Date.now(), rows: [], pending: null }; throw error; }); // negative cache: a failing/404 endpoint is not retried on every page load until CATALOG_TTL_MS
  }
  if (brandCache.rows) { brandCache.pending.catch(() => {}); return brandCache.rows; }
  return brandCache.pending;
}

// Storefront brands that really have clothing products on sale, best sellers first.
// product count / sold total are counted from the clothing catalogue (the tenant may also hold grocery products).
// `image` = the brand logo when set, otherwise a photo of one of its products (isLogo tells the UI which one).
export async function brands() {
  if (process.env.DOKANI_BRANDS !== "1") return []; // /storefront/brands does not exist on the backend yet: no call at all. Set DOKANI_BRANDS=1 in .env.local once it does.
  const rows = await brandRows();
  return rows.map((brand) => {
    const logo = storefrontImageUrl(brand.logo_url || brand.logo);
    return {
      id: String(brand.id), name: String(brand.name || "").trim(), slug: brand.slug || "",
      image: logo, isLogo: Boolean(logo),
      productCount: Number(brand.product_count) || 0, soldTotal: Number(brand.sold_total) || 0,
    };
  }).filter((brand) => brand.name && brand.productCount > 0)
    .sort((a, b) => b.soldTotal - a.soldTotal || b.productCount - a.productCount || a.name.localeCompare(b.name));
}

export async function categories() {
  const toCategory = (c) => ({
    id: c.id,
    key: String(c.name || "").toLowerCase().replace(/[^a-z0-9]+/g, ""),
    name: c.name,
    slug: c.slug,
    image: c.image,
    image_url: c.image_url || (String(c.image || "").startsWith("http") ? c.image : null),
    shopId: c.shop_id ?? cfg().shopId ?? null,
    parent_id: c.parent_id ?? null,
    status: c.status,
    sold_quantity: Number(c.sold_quantity) || 0,
    visible: c.visible,
    subs: (c.subs || []).filter((sub) => Number(sub.status) === 1 && sub.visible !== false).map(toCategory),
  });
  return (await categoryRows())
    .filter((c) => Number(c.status) === 1 && c.visible !== false)
    .map(toCategory);
}

// For GET /api/dokani/health: a plain-language report of what the connection sees. Never contains passwords or tokens.
export async function health() {
  const out = { ok: false, shopIdInEnv: cfg().shopId || null, branchIdInEnv: cfg().branchId || null, problems: [] };
  try {
    const rows = await rawRows();
    const cats = await categories();
    const products = await storefrontRows(rows);
    const items = products.filter((p) => isSellable(p) && isClothingProduct(p)).map((p, i) => mapProduct(p, "en", i));
    out.shopIdSeenInData = cats[0]?.shopId ?? null; // the shop the login really belongs to
    out.products = { total: rows.filter((p) => isSellable(p)).length, shown: items.length, withStock: items.filter((p) => p.stock > 0).length, withPhoto: items.filter((p) => p.hasPhoto).length, withVariants: items.filter((p) => p.is_size || p.is_colour).length };
    out.categories = cats;
    out.sample = items.slice(0, 5).map((p) => ({ id: p.id, name: p.name, avenorCategory: p.category, genders: p.genders, sizes: p.sizes, price: p.price, mrp: p.mrp, stock: p.stock, tags: p.tags }));
    if (!items.length) out.problems.push("Dokani returned no sellable products. Add products in the Dokani panel (status active, not a service).");
    if (items.length && !out.products.withStock) out.problems.push("No product has stock. In Dokani add a Purchase for the products, otherwise every product shows as out of stock.");
    if (items.length && !out.products.withPhoto) out.problems.push("No product has a photo in Dokani. AVENOR shows a category picture instead until photos are uploaded.");
    if (!cfg().shopId) out.problems.push("DOKANI_SHOP_ID is not set. It is only a safety check, but set it so a wrong login is caught.");
    out.ok = true;
  } catch (e) {
    out.error = e?.message || String(e);
    out.problems.push(out.error);
  }
  return out;
}
