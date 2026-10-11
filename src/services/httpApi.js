// ---------------------------------------------------------------------------
// REAL BACKEND (Laravel). Same methods and return shapes as mockApi.js.
// Endpoint paths follow "AVENOR API Specification v2" (E1 to E41, listed next to each method).
// Server JSON -> UI shapes is done by adapters.js, so if a field name differs only adapters.js (and the path here) change.
// ---------------------------------------------------------------------------
import { http, unwrap, metaOf } from "./http";
import { tokenStore } from "./tokenStore";
import { ApiError } from "./errors";
import { CATALOG_REVALIDATE } from "./config";
import * as A from "./adapters";

const PUBLIC = { auth: false };
const asList = (json) => { const d = unwrap(json); return Array.isArray(d) ? d : d?.items ?? d?.data ?? []; };

// UI filter names -> API query names
const listQuery = (p = {}) => ({
  gender: p.gender, category: p.category, tag: p.tag, q: p.q, availability: p.availability,
  max_price: p.maxPrice, min_price: p.minPrice, color: p.color, size: p.size, sort: p.sort, page: p.page, limit: p.limit,
});

// Cart endpoints answer with the updated cart. If one answers 204 / without a body, fetch the cart instead.
async function cartFrom(json) {
  const d = unwrap(json);
  return A.toCart(d && Array.isArray(d.items) ? d : unwrap(await http("/cart")));
}

export const httpApi = {
  // ===== Authentication ====================================================
  auth: {
    // E1 POST /auth/register
    async register(b) {
      const r = unwrap(await http("/auth/register", { method: "POST", auth: false, body: {
        name: b.name, email: b.email, password: b.password, password_confirmation: b.passwordConfirmation, terms: b.terms, referral: b.referral || undefined,
      } }));
      if (!r?.token) throw new ApiError("The server did not return a login token.");
      tokenStore.set(r.token);
      return { token: r.token, user: A.toUser(r.user) };
    },
    // E2 POST /auth/login
    async login(b) {
      const r = unwrap(await http("/auth/login", { method: "POST", auth: false, body: { email: b.email, password: b.password } }));
      if (!r?.token) throw new ApiError("The server did not return a login token.");
      tokenStore.set(r.token);
      return { token: r.token, user: A.toUser(r.user) };
    },
    // E3 POST /auth/logout
    async logout() { try { await http("/auth/logout", { method: "POST" }); } catch { /* token may already be dead */ } tokenStore.clear(); },
    // E4 GET /auth/me
    async me() { return A.toUser(unwrap(await http("/auth/me"))); },
  },

  // ===== Catalogue (public) ================================================
  catalog: {
    // E5 GET /products  -> { items, meta }
    async list(params = {}, { lang = "bn" } = {}) {
      const json = await http("/products", { ...PUBLIC, lang, query: listQuery(params), revalidate: CATALOG_REVALIDATE });
      const rows = asList(json);
      return { items: rows.map((r, i) => A.toCatalogItem(r, lang, i)), meta: metaOf(json, rows.length) };
    },
    // every page of /products (the shop shows all products on one page and filters them itself)
    async listAll(params = {}, { lang = "bn", pageSize = 100, maxPages = 20 } = {}) {
      const all = [];
      for (let page = 1; page <= maxPages; page++) {
        const { items, meta } = await this.list({ ...params, page, limit: pageSize }, { lang });
        all.push(...items);
        if (page >= (meta.last_page ?? 1) || items.length === 0) break;
      }
      return all.map((p, i) => ({ ...p, order: i }));
    },
    // E6 GET /products/:id  -> item | null (404)
    async get(id, { lang = "bn" } = {}) {
      try { return A.toCatalogItem(unwrap(await http(`/products/${encodeURIComponent(id)}`, { ...PUBLIC, lang, revalidate: CATALOG_REVALIDATE })), lang); }
      catch (e) { if (e.status === 404) return null; throw e; }
    },
    // E7 GET /products/:id/related
    async related(id, { limit = 4, lang = "bn" } = {}) {
      const rows = asList(await http(`/products/${encodeURIComponent(id)}/related`, { ...PUBLIC, lang, query: { limit }, revalidate: CATALOG_REVALIDATE }));
      return rows.map((r, i) => A.toCatalogItem(r, lang, i));
    },
    // E8 GET /products/:id/reviews
    async reviews(id, { page = 1, limit = 10, lang = "bn" } = {}) {
      const json = await http(`/products/${encodeURIComponent(id)}/reviews`, { ...PUBLIC, lang, query: { page, limit } });
      return { items: asList(json).map(A.toReview), meta: metaOf(json) };
    },
    // E9 GET /categories
    async categories({ lang = "bn" } = {}) { return asList(await http("/categories", { ...PUBLIC, lang, revalidate: CATALOG_REVALIDATE })).map(A.toCategory); },
    // E10 GET /genders
    async genders({ lang = "bn" } = {}) { return asList(await http("/genders", { ...PUBLIC, lang, revalidate: CATALOG_REVALIDATE })).map(A.toGender); },
  },

  // ===== Cart ==============================================================
  cart: {
    // E11 GET /cart?shipping=standard|express
    async get({ shipping } = {}) { return A.toCart(unwrap(await http("/cart", { query: { shipping } }))); },
    // E12 POST /cart/items
    async add({ productId, size, color, qty }) { return cartFrom(await http("/cart/items", { method: "POST", body: { product_id: productId, size, color, qty } })); },
    // E13 POST /cart/outfit
    async addOutfit(items) { return cartFrom(await http("/cart/outfit", { method: "POST", body: { items: items.map((i) => ({ product_id: i.productId, size: i.size, color: i.color })) } })); },
    // E14 PUT /cart/items/:itemId
    async setQty(itemId, qty) { return cartFrom(await http(`/cart/items/${itemId}`, { method: "PUT", body: { qty } })); },
    // E15 DELETE /cart/items/:itemId
    async remove(itemId) { return cartFrom(await http(`/cart/items/${itemId}`, { method: "DELETE" })); },
    // E16 DELETE /cart
    async clear() { await http("/cart", { method: "DELETE" }); return A.toCart({}); },
  },

  // ===== Wishlist ==========================================================
  wishlist: {
    // E17 GET /wishlist  -> { ids }
    async get() { return { ids: asList(await http("/wishlist")).map((r) => Number(typeof r === "object" ? r.id ?? r.product_id : r)).filter(Number.isInteger) }; },
    // E18 POST /wishlist
    async add(productId) { await http("/wishlist", { method: "POST", body: { product_id: productId } }); },
    // E19 DELETE /wishlist/:productId
    async remove(productId) { await http(`/wishlist/${productId}`, { method: "DELETE" }); },
  },

  // ===== Price alerts ======================================================
  priceAlerts: {
    // E20 GET /price-alerts  -> { prefs, items: { [productId]: { basePrice, since } } }
    async get() { return A.toAlerts(unwrap(await http("/price-alerts"))); },
    // E21 PUT /price-alerts/prefs
    async savePrefs(prefs) { await http("/price-alerts/prefs", { method: "PUT", body: A.fromPrefs(prefs) }); return prefs; },
    // E22 PUT /price-alerts/:productId   (also resets the baseline after "Got it")
    async enable(productId, basePrice) { await http(`/price-alerts/${productId}`, { method: "PUT", body: { base_price: basePrice } }); },
    // E23 DELETE /price-alerts/:productId
    async disable(productId) { await http(`/price-alerts/${productId}`, { method: "DELETE" }); },
  },

  // ===== Orders ============================================================
  orders: {
    // E24 POST /orders   args: { form, items: [{ productId, size, color, qty }], shipping }
    async place(args) { return A.toOrder(unwrap(await http("/orders", { method: "POST", body: A.fromOrderForm(args) }))); },
    // E25 GET /orders
    async list({ page = 1, limit = 50 } = {}) { return asList(await http("/orders", { query: { page, limit } })).map(A.toOrder); },
    // E42 GET /orders/:id   (order tracking page; should include items[] and a status history[] = [{ status, at }])
    async get(id) { const d = unwrap(await http(`/orders/${id}`)); return A.toOrder(d?.order ?? d); },
    // E43 POST /orders/:id/cancel   body { reason, note }   (only while the order is pending / processing)
    async cancel(id, { reason, note } = {}) {
      const d = unwrap(await http(`/orders/${id}/cancel`, { method: "POST", body: { reason, note: note || undefined } }));
      return A.toOrder(d?.order ?? d);
    },
    // E26 POST /orders/:id/return   body { type, reason, note }
    async requestReturn(id, { type, reason, note }) {
      const d = unwrap(await http(`/orders/${id}/return`, { method: "POST", body: { type, reason, note: note || undefined } }));
      return A.toReturnRequest(d?.return_request ?? d);
    },
  },

  // ===== Profile, addresses, size passport =================================
  user: {
    // E27 GET /users/profile
    async profile() { return A.toUser(unwrap(await http("/users/profile"))); },
    // E28 PUT /users/profile
    async updateProfile({ name, email, phone }) { return A.toUser(unwrap(await http("/users/profile", { method: "PUT", body: { name, email, phone } }))); },
    addresses: {
      // E29 GET /users/addresses
      async list() { return asList(await http("/users/addresses")).map(A.toAddress); },
      // E30 POST /users/addresses
      async add({ type, address, city, phone }) { await http("/users/addresses", { method: "POST", body: { type, address, city, phone: phone || undefined } }); return this.list(); },
      // E31 PUT /users/addresses/:id/default
      async setDefault(id) { await http(`/users/addresses/${id}/default`, { method: "PUT" }); return this.list(); },
      // E32 DELETE /users/addresses/:id
      async remove(id) { await http(`/users/addresses/${id}`, { method: "DELETE" }); return this.list(); },
    },
    sizePassport: {
      // E33 GET /users/size-passport
      async get() { return A.toSizePassport(unwrap(await http("/users/size-passport")) || {}); },
      // E34 PUT /users/size-passport
      async save(p) { return A.toSizePassport(unwrap(await http("/users/size-passport", { method: "PUT", body: A.fromSizePassport(p) })) || A.fromSizePassport(p)); },
      // E35 DELETE /users/size-passport
      async clear() { await http("/users/size-passport", { method: "DELETE" }); },
    },
  },

  // ===== Referral ==========================================================
  referrals: {
    // E36 GET /referrals/me
    async me() { return A.toReferral(unwrap(await http("/referrals/me"))); },
    // E37 POST /referrals/apply   (422 reason: invalid_format | unknown | own_code | already_used)
    async apply(code) { await http("/referrals/apply", { method: "POST", body: { code } }); },
  },

  // ===== Other =============================================================
  // E38 POST /support  -> { reference }
  support: { async send({ name, contact, order, topic, message }) {
    const d = unwrap(await http("/support", { method: "POST", auth: false, body: { name, contact, order: order || undefined, topic, message } }));
    return { reference: d?.reference ?? null };
  } },
  // E39 POST /newsletter/subscribe
  newsletter: { async subscribe(email) { await http("/newsletter/subscribe", { method: "POST", auth: false, body: { email } }); } },
  // E40 GET /campaigns  -> raw rows (lib/v2/campaigns.js normalises them)
  campaigns: { async list() { const json = await http("/campaigns", { ...PUBLIC, revalidate: CATALOG_REVALIDATE }); const d = unwrap(json); return Array.isArray(d) ? d : d?.campaigns ?? []; } },
  // E41 GET /settings
  settings: { async get() { return A.toSettings(unwrap(await http("/settings", { ...PUBLIC, revalidate: CATALOG_REVALIDATE })) || {}); } },
};
