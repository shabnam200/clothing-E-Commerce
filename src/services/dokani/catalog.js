// AVENOR catalogue read straight from Dokani Cloud (server only). Same method names as api.catalog in services/, so
// lib/v2/catalogSource.js can use either. Products are cached in memory for CATALOG_TTL_MS.
import { relatedProducts } from "@/lib/v2/catalog";
import { assertShop, dokaniGet } from "./client";
import { CATALOG_TTL_MS, cfg } from "./config";
import { isSellable, mapProduct } from "./mapper";

const PER_PAGE = 100;
let cache = { at: 0, rows: null, pending: null };
let verified = null; // "<login>|<shopId>" once the shop check passed

export function clearCatalogCache() { cache = { at: 0, rows: null, pending: null }; verified = null; }

async function categoryRows() {
  const j = await dokaniGet("/shops/category");
  const rows = Array.isArray(j.category) ? j.category : j.category?.data ?? [];
  assertShop(rows); // every category row carries shop_id: this proves which shop the login belongs to
  return rows;
}
// Runs once per login: refuses to serve products when the login belongs to a different shop than DOKANI_SHOP_ID.
async function verifyShopOnce() {
  const c = cfg();
  if (!c.shopId) return;
  const key = `${c.login}|${c.shopId}`;
  if (verified === key) return;
  await categoryRows();
  verified = key;
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
    cache.pending = verifyShopOnce()
      .then(fetchAllRows)
      .then((rows) => { assertShop(rows); cache = { at: Date.now(), rows, pending: null }; return rows; })
      .catch((e) => { cache.pending = null; throw e; });
  }
  return cache.pending;
}

export async function listAll(_params = {}, { lang = "bn" } = {}) {
  const rows = (await rawRows()).filter(isSellable);
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
  return (await categoryRows()).filter((c) => c.status !== 0).map((c) => ({ id: c.id, name: c.name, shopId: c.shop_id ?? null }));
}

// For GET /api/dokani/health: a plain-language report of what the connection sees. Never contains passwords or tokens.
export async function health() {
  const out = { ok: false, shopIdInEnv: cfg().shopId || null, branchIdInEnv: cfg().branchId || null, problems: [] };
  try {
    const rows = await rawRows();
    const cats = await categories();
    const items = rows.filter(isSellable).map((p, i) => mapProduct(p, "en", i));
    out.shopIdSeenInData = cats[0]?.shopId ?? null; // the shop the login really belongs to
    out.products = { total: rows.length, shown: items.length, withStock: items.filter((p) => p.stock > 0).length, withPhoto: items.filter((p) => p.hasPhoto).length, withVariants: rows.filter((r) => r.is_size || r.is_colour).length };
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
