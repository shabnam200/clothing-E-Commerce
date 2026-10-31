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
import { parseIdentifier } from "@/lib/v2/identity";

const shopperCall = (path, options = {}) => http(`/api/shopper/${path}`, { base: "", ...options });

// Credential fields for /auth/login and /auth/register. An email is sent exactly as before ({ email });
// a mobile number is sent as { phone, login } (normalised to 01XXXXXXXXX).
const credential = (b) => {
  const { type, value } = parseIdentifier(b.identifier ?? b.email ?? b.phone);
  return type === "phone" ? { phone: value, login: value } : { email: type === "email" ? value : b.email };
};
const asList = (json) => { const d = unwrap(json); return Array.isArray(d) ? d : d?.items ?? d?.data ?? d?.addresses ?? d?.products ?? d?.categories ?? d?.companies ?? d?.units ?? d?.reviews ?? d?.genders ?? []; };

// UI filter names -> API query names
const listQuery = (p = {}) => ({
  search: p.q, category: p.category, company: p.company, status: 1, page: p.page, per_page: p.limit,
});

// Cart endpoints answer with the updated cart. If one answers 204 / without a body, fetch the cart instead.
async function cartFrom(json) {
  const d = unwrap(json);
  return A.toCart(d?.cart ?? (d && Array.isArray(d.items) ? d : unwrap(await shopperCall("cart"))?.cart));
}

export const httpApi = {
  // ===== Authentication ====================================================
  auth: {
    // E1 POST /auth/register  (email OR phone: whichever the customer typed)
    async register(b) {
      const r = unwrap(await http("/auth/register", { method: "POST", auth: false, body: {
        name: b.name, ...credential(b), password: b.password, password_confirmation: b.passwordConfirmation, terms: b.terms, referral: b.referral || undefined,
      } }));
      if (!r?.token) throw new ApiError("The server did not return a login token.");
      tokenStore.set(r.token);
      return { token: r.token, user: A.toUser(r.user) };
    },
    // E2 POST /auth/login  ({ email | phone + login, password })
    async login(b) {
      const r = unwrap(await http("/auth/login", { method: "POST", auth: false, body: { ...credential(b), password: b.password } }));
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
      const json = await shopperCall("catalog/products", { auth: false, lang, query: listQuery(params), revalidate: CATALOG_REVALIDATE });
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
      try { return A.toCatalogItem(unwrap(await shopperCall(`catalog/products/${encodeURIComponent(id)}`, { auth: false, lang, revalidate: CATALOG_REVALIDATE })), lang); }
      catch (e) { if (e.status === 404) return null; throw e; }
    },
    // E7 GET /products/:id/related
    async related(id, { limit = 4, lang = "bn" } = {}) {
      const rows = asList(await shopperCall(`products/${encodeURIComponent(id)}/related`, { auth: false, lang, query: { limit }, revalidate: CATALOG_REVALIDATE }));
      return rows.map((r, i) => A.toCatalogItem(r, lang, i));
    },
    // E8 GET /products/:id/reviews
    async reviews(id, { page = 1, limit = 10, lang = "bn" } = {}) {
      // the token is optional here: when present, the server marks which reviews the person found helpful / wrote
      const json = await shopperCall(`reviews/${encodeURIComponent(id)}`, { auth: false, lang, query: { page, per_page: limit } });
      return { items: asList(json).map(A.toReview), meta: metaOf(json) };
    },
    // E9 GET /categories
    async categories({ lang = "bn" } = {}) { return asList(await shopperCall("catalog/categories", { auth: false, lang, revalidate: CATALOG_REVALIDATE })).map(A.toCategory); },
    async companies({ lang = "bn" } = {}) { return asList(await shopperCall("catalog/companies", { auth: false, lang, revalidate: CATALOG_REVALIDATE })).map((r) => ({ id: r.id, name: r.name, logo: r.logo ?? null })); },
    async units({ lang = "bn" } = {}) { return asList(await shopperCall("catalog/units", { auth: false, lang, revalidate: CATALOG_REVALIDATE })).map((r) => ({ id: r.id, name: r.name, shortName: r.short_name ?? null })); },
    // E10 GET /genders
    async genders() { return asList(await shopperCall("genders", { auth: false, revalidate: CATALOG_REVALIDATE })).map(A.toGender); },
  },

  delivery: {
    async options(city) {
      const data = unwrap(await shopperCall("delivery/options", { auth: false, query: city ? { city } : undefined, revalidate: 0 }));
      return Array.isArray(data?.options) ? data.options : [];
    },
  },
  // ===== Cart ==============================================================
  cart: {
    // E11 GET /cart?shipping=standard|express
    async get() { return A.toCart(unwrap(await shopperCall("cart"))?.cart); },
    // E12 POST /cart/items
    async add({ productId, size, color, qty }) { return cartFrom(await shopperCall("cart/items", { method: "POST", body: { product_id: productId, size, color, quantity: qty } })); },
    // E13 POST /cart/outfit
    async addOutfit(items) { return cartFrom(await shopperCall("cart/outfit", { method: "POST", body: { items: items.map((i) => ({ product_id: i.productId, size: i.size, color: i.color })) } })); },
    // E14 PUT /cart/items/:itemId
    async setQty(itemId, qty) { return cartFrom(await shopperCall(`cart/items/${itemId}`, { method: "PUT", body: { quantity: qty } })); },
    // E15 DELETE /cart/items/:itemId
    async remove(itemId) { return cartFrom(await shopperCall(`cart/items/${itemId}`, { method: "DELETE" })); },
    // E16 DELETE /cart
    async clear() { await shopperCall("cart", { method: "DELETE" }); return A.toCart({}); },
  },

  // ===== Wishlist ==========================================================
  wishlist: {
    // E17 GET /wishlist  -> { ids }
    async get() { return { ids: asList(await shopperCall("wishlist")).map((r) => Number(typeof r === "object" ? r.product_id ?? r.id : r)).filter(Number.isInteger) }; },
    // E18 POST /wishlist
    async add(productId) { await shopperCall("wishlist", { method: "POST", body: { product_id: productId } }); },
    // E19 DELETE /wishlist/:productId
    async remove(productId) { await shopperCall(`wishlist/${productId}`, { method: "DELETE" }); },
  },

  // ===== Price alerts ======================================================
  priceAlerts: {
    // E20 GET /price-alerts  -> { prefs, items: { [productId]: { basePrice, since } } }
    async get() {
      const [alertsResponse, preferencesResponse] = await Promise.all([shopperCall("alerts"), shopperCall("alerts/preferences")]);
      const rows = unwrap(alertsResponse)?.alerts ?? [];
      return A.toAlerts({ prefs: unwrap(preferencesResponse)?.preferences, items: rows.filter((a) => a.type === "price_drop" && Number(a.status) === 1).map((a) => ({ product_id: a.product_id, base_price: a.target_price, since: a.created_at })) });
    },
    // E21 PUT /price-alerts/prefs
    async savePrefs(prefs) { await shopperCall("alerts/preferences", { method: "PUT", body: A.fromPrefs(prefs) }); return prefs; },
    // E22 PUT /price-alerts/:productId   (also resets the baseline after "Got it")
    async enable(productId, basePrice) { await shopperCall(`products/${productId}/price-alert`, { method: "POST", body: { target_price: basePrice } }); },
    // E23 DELETE /price-alerts/:productId
    async disable(productId) { await shopperCall(`products/${productId}/price-alert`, { method: "DELETE" }); },
  },

  // ===== Orders ============================================================
  orders: {
    // Storefront checkout is coordinated by the Next.js server route.
    async place(args) {
      const { form, items, shipping } = args;
      const orderNo = args.orderNo || `AVN-${globalThis.crypto.randomUUID()}`;
      const result = unwrap(await http("/api/dokani/checkout", {
        base: "", method: "POST",
        body: {
          form: {
            name: form.name.trim(), phone: form.phone.replace(/[\s-]/g, ""), email: form.email?.trim() || "",
            district: form.district, address: form.address.trim(), note: form.note?.trim() || "", delivery_option_id: args.deliveryOptionId || undefined,
            method: form.method || "cod", trx: form.method === "cod" ? "" : (form.trx || "").trim(), coupon: form.coupon?.trim() || "",
            point_claim: Number(form.point_claim || 0), point_discount: Number(form.point_discount || 0),
          },
          items: items.map((item) => ({ productId: item.productId, size: item.size, color: item.color, qty: item.qty })),
          shipping, orderNo,
        },
      }));
      return { ...A.toOrder({ ...result, order_number: result?.orderNo, total: result?.total, address: result?.address }), trackingId: result?.orderNo || result?.id };
    },
    // E25 GET /orders
    async list({ page = 1, limit = 50 } = {}) { return asList(await shopperCall("orders", { query: { page, per_page: limit } })).map(A.toOrder); },
    // E42 GET /orders/:id   (order tracking page; should include items[] and a status history[] = [{ status, at }])
    async get(id) { const d = unwrap(await shopperCall(`orders/${id}`)); return A.toOrder(d?.order ?? d); },
    // E43 POST /orders/:id/cancel   body { reason, note }   (only while the order is pending / processing)
    async cancel(id, { reason, note } = {}) {
      const d = unwrap(await shopperCall(`orders/${id}/cancel`, { method: "POST", body: { reason, note: note || undefined } }));
      return A.toOrder(d?.order ?? d);
    },
    // E26 POST /orders/:id/return   body { type, reason, note }
    async requestReturn(id, { type, reason, note }, order) {
      const items = (order?.items || []).map((i) => ({ product_id: i.productId, quantity: i.qty }));
      const d = unwrap(await shopperCall(`orders/${id}/return`, { method: "POST", body: { type, reason, note: note || undefined, items } }));
      return A.toReturnRequest(d?.return_request ?? d);
    },
  },

  // ===== Coupons ===========================================================
  coupons: {
    // E44 POST /coupons/validate   body { code, shipping }  (the server prices the logged-in user's cart itself)
    //     -> { code, type, value, discount, message }   422 reason: invalid | min_subtotal | already_used | first_order_only | not_applicable | expired
    async validate({ code, shipping, subtotal = 0 }) {
      const coupon = A.toCoupon(unwrap(await shopperCall("coupons/validate", { method: "POST", body: { code, shipping, subtotal } })));
      if (!coupon.valid) throw new ApiError(coupon.message || "This coupon cannot be used.", { status: 422, reason: "invalid_coupon" });
      return coupon;
    },
  },

  // ===== Reviews ===========================================================
  reviews: {
    // E45 POST /products/:id/reviews   body { rating, text }  -> the new review
    async create(productId, { rating, text }) { return A.toReview(unwrap(await shopperCall(`products/${encodeURIComponent(productId)}/reviews`, { method: "POST", body: { rating, text } }))); },
    // E46 PUT /reviews/:id/helpful   /   E47 DELETE /reviews/:id/helpful   -> { helpful, helpfulCount }
    async setHelpful(reviewId, on) {
      const d = unwrap(await shopperCall(`reviews/${reviewId}/helpful`, { method: "POST", body: { helpful: on } })) || {};
      return A.toHelpful({ helpful: on, ...d });
    },
  },

  // ===== Profile, addresses, size passport =================================
  user: {
    // E27 GET /users/profile
    async profile() { return A.toUser(unwrap(await shopperCall("me"))); },
    // E28 PUT /users/profile
    async updateProfile({ name, email, phone }) { return A.toUser(unwrap(await shopperCall("profile", { method: "PUT", body: { name, email, phone } }))); },
    addresses: {
      // E29 GET /users/addresses
      async list() { return asList(await shopperCall("users/addresses")).map(A.toAddress); },
      // E30 POST /users/addresses
      async add({ type, address, city, phone, name }) { await shopperCall("users/addresses", { method: "POST", body: { label: type || "Home", name: name || "", line: address, city, phone: phone || undefined } }); return this.list(); },
      // E31 PUT /users/addresses/:id/default
      async setDefault(id) { await shopperCall(`users/addresses/${id}/default`, { method: "PUT" }); return this.list(); },
      // E32 DELETE /users/addresses/:id
      async remove(id) { await shopperCall(`users/addresses/${id}`, { method: "DELETE" }); return this.list(); },
    },
    sizePassport: {
      // E33 GET /users/size-passport
      async get() { return A.toSizePassport(unwrap(await shopperCall("users/size-passport"))?.size_passport || {}); },
      // E34 PUT /users/size-passport
      async save(p) { return A.toSizePassport(unwrap(await shopperCall("users/size-passport", { method: "PUT", body: A.fromSizePassport(p) }))?.size_passport || A.fromSizePassport(p)); },
      // E35 DELETE /users/size-passport
      async clear() { await shopperCall("size-passport", { method: "DELETE" }); },
    },
  },

  // ===== Referral ==========================================================
  referrals: {
    // E36 GET /referrals/me
    async me() { return A.toReferral(unwrap(await shopperCall("referrals/me"))); },
    // E37 POST /referrals/apply   (422 reason: invalid_format | unknown | own_code | already_used)
    async apply(code) { await shopperCall("referrals/apply", { method: "POST", body: { code } }); },
  },

  // ===== Other =============================================================
  // E38 POST /support  -> { reference }
  support: { async send({ name, contact, order, topic, message }) {
    const d = unwrap(await shopperCall("support", { method: "POST", auth: false, body: { name, contact, order: order || undefined, topic, message } }));
    return { reference: d?.reference ?? null };
  } },
  // E39 POST /newsletter/subscribe
  newsletter: { async subscribe(email) { await shopperCall("newsletter/subscribe", { method: "POST", auth: false, body: { email } }); } },
  // E40 GET /campaigns  -> raw rows (lib/v2/campaigns.js normalises them)
  campaigns: { async list() { const json = await shopperCall("campaigns", { auth: false, revalidate: CATALOG_REVALIDATE }); const d = unwrap(json); return Array.isArray(d) ? d : d?.campaigns ?? []; } },
  // E41 GET /settings
  settings: { async get() { return A.toSettings(unwrap(await shopperCall("settings", { auth: false, revalidate: CATALOG_REVALIDATE })) || {}); } },
};
