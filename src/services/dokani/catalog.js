// AVENOR catalogue read straight from Dokani Cloud (server only). Same method names as api.catalog in services/, so
// lib/v2/catalogSource.js can use either. Products are cached in memory for CATALOG_TTL_MS.
import { relatedProducts } from "@/lib/v2/catalog";
import { assertShop, dokaniGet } from "./client";
import { CATALOG_TTL_MS, cfg } from "./config";
import { isClothingProduct, isSellable, mapProduct } from "./mapper";

const PER_PAGE = 100;
let cache = { at: 0, rows: null, pending: null };
let categoryCache = { at: 0, rows: null, pending: null };

export function clearCatalogCache() {
  cache = { at: 0, rows: null, pending: null };
  categoryCache = { at: 0, rows: null, pending: null };
}

async function categoryRows() {
  if (categoryCache.rows && Date.now() - categoryCache.at < CATALOG_TTL_MS) return categoryCache.rows;
  if (!categoryCache.pending) {
    categoryCache.pending = dokaniGet("/shops/category")
      .then((j) => Array.isArray(j.category) ? j.category : j.category?.data ?? [])
      .then((rows) => { assertShop(rows); categoryCache = { at: Date.now(), rows, pending: null }; return rows; })
      .catch((error) => { categoryCache.pending = null; throw error; });
  }
  return categoryCache.pending;
}
// GET /shops/products, page by page. A plain-array answer that is shorter than PER_PAGE is the last page.
async function fetchAllRows() {
  const all = [];
  let firstId = null;
  for (let page = 1; page <= 30; page++) {
    const j = await dokaniGet("/shops/products", { per_page: PER_PAGE, page });
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
      .catch((e) => { cache.pending = null; throw e; });
  }
  return cache.pending;
}

// Raw Dokani rows are server-only and used by checkout to resolve variant IDs
// and prices from the trusted catalogue, never from browser-submitted prices.
export async function getRawProduct(id) {
  return (await rawRows()).find((p) => String(p.id) === String(id) && isSellable(p) && isClothingProduct(p)) ?? null;
}

export async function listAll(_params = {}, { lang = "bn" } = {}) {
  const rows = (await rawRows()).filter((p) => isSellable(p) && isClothingProduct(p));
  const now = Date.now();
  return rows.map((p, i) => mapProduct(p, lang, i, now));
}
export async function list(params = {}, opts = {}) { const items = await listAll(params, opts); return { items, meta: { page: 1, limit: items.length, total: items.length, last_page: 1 } }; }
export async function get(id, opts = {}) { return (await listAll({}, opts)).find((p) => String(p.id) === String(id)) ?? null; }
export async function related(id, { limit = 4, lang = "bn" } = {}) {
  const all = await listAll({}, { lang });
  const p = all.find((x) => String(x.id) === String(id));
  return p ? relatedProducts(all, p, limit) : [];
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
    const items = rows.filter((p) => isSellable(p) && isClothingProduct(p)).map((p, i) => mapProduct(p, "en", i));
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
