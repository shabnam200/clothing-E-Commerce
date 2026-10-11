// ---------------------------------------------------------------------------
// MOCK BACKEND: a fake server that lives in the browser (localStorage "avenor:mock:db:v1").
// It behaves like the real Laravel API: it validates input (422), enforces stock / quantity / return-window rules,
// calculates prices and totals itself, creates orders, tracks referral rewards, and answers with the SAME snake_case JSON
// as the real API. That JSON goes through adapters.js exactly like httpApi.js, so switching to the real server changes nothing in the UI.
// Same methods and return shapes as httpApi.js.   Not for production: passwords are only lightly hashed here.
// ---------------------------------------------------------------------------
import { ApiError, invalid, notFound, unauthenticated } from "./errors";
import { tokenStore } from "./tokenStore";
import { MOCK_LATENCY } from "./config";
import { currentLang } from "./http";
import * as A from "./adapters";
import { buildCatalog, findProduct, relatedProducts } from "@/lib/v2/catalog";
import { V2_CATEGORIES, V2_GENDERS, V2_PRODUCTS } from "@/data/v2";
import { CAMPAIGN_FALLBACK } from "@/config/campaigns";
import { DELIVERY_FEE, DISTRICTS, EXPRESS_FEE, FREE_DELIVERY_OVER, MAX_QTY, PAYMENT_ACCOUNTS, POINTS_PER_TAKA, REFERRAL_REWARD, RETURN_WINDOW_DAYS, SUPPORT } from "@/config/v2";
import bn from "@/messages/v2/bn";
import en from "@/messages/v2/en";

const MSG = { bn, en };
const RAW = new Map(V2_PRODUCTS.map((p) => [p.id, p]));
const DAY = 86_400_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+?88)?01[3-9]\d{8}$/;
const CODE_RE = /^AVN-[23456789A-HJKMNP-Z]{5}$/;
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const RANGES = { height: [100, 230], weight: [25, 250], chest: [60, 160], waist: [50, 150], age: [1, 14] };
const TIERS = [["Member", 0], ["Silver", 500], ["Gold", 1500], ["VIP Elite", 3000]];
const phoneOf = (v) => String(v ?? "").replace(/[\s-]/g, "");

// ---------- the "database" ----------------------------------------------------
const KEY = "avenor:mock:db:v1";
let memDb = null;
const blank = () => ({ seq: 9000, users: {}, sessions: {}, newsletter: [], support: [] });
const storage = () => { try { return typeof window !== "undefined" && window.localStorage ? window.localStorage : null; } catch { return null; } };
function read() {
  const ls = storage();
  if (ls) { try { const raw = ls.getItem(KEY); return raw ? { ...blank(), ...JSON.parse(raw) } : blank(); } catch { return blank(); } }
  return (memDb ||= blank());
}
function write(db) {
  const ls = storage();
  if (ls) { try { ls.setItem(KEY, JSON.stringify(db)); return; } catch { /* quota / private mode */ } }
  memDb = db;
}
const tx = (fn) => { const db = read(); const out = fn(db); write(db); return out; };
const nextId = (db) => ++db.seq;

const hash = (s) => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return String(h); };
const token = () => `mock_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

function authed(db) {
  const t = tokenStore.get();
  const u = t && db.users[db.sessions[t]];
  if (!u) {
    if (t && typeof window !== "undefined") { tokenStore.clear(); window.dispatchEvent(new Event("avenor:auth-expired")); }
    throw unauthenticated();
  }
  return u;
}

// ---------- helpers that mirror server business rules --------------------------
const lang = () => currentLang();
const productName = (p, l = lang()) => (MSG[l] ?? bn).products.items[p.key];
const stockOf = (p) => (p.stock !== undefined ? p.stock : 10);
const maxQtyOf = (p) => Math.min(MAX_QTY, stockOf(p));
const deliveryFor = (subtotal, shipping) => (subtotal === 0 ? 0 : shipping === "express" ? EXPRESS_FEE : subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE);
const makeCode = (db) => {
  for (;;) {
    const bytes = new Uint8Array(5);
    (globalThis.crypto || { getRandomValues: (a) => a.map(() => Math.floor(Math.random() * 256)) }).getRandomValues(bytes);
    const code = `AVN-${Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("")}`;
    if (!Object.values(db.users).some((u) => u.referral.code === code)) return code;
  }
};

const pointsOf = (u) => {
  const spent = u.orders.filter((o) => !o.sample && o.status !== "cancelled").reduce((s, o) => s + o.total, 0); // sample orders do not earn points
  const referral = u.referral.ledger.filter((l) => l.status === "credited").reduce((s, l) => s + l.amount * POINTS_PER_TAKA, 0);
  return Math.floor(spent / 10) + referral;
};
const userJson = (u) => {
  const points = pointsOf(u);
  const idx = TIERS.reduce((a, [, min], i) => (points >= min ? i : a), 0);
  return { id: u.id, name: u.name, email: u.email, phone: u.phone || null, tier: TIERS[idx][0], points, next_tier_points: (TIERS[idx + 1] ?? TIERS[idx])[1] };
};

function cartJson(u, shipping = "standard") {
  const items = u.cart.flatMap((l) => {
    const p = RAW.get(l.productId);
    if (!p) return [];
    const qty = Math.min(l.qty, maxQtyOf(p));
    return [{ id: l.id, product_id: p.id, name: productName(p), image: p.image, size: l.size, color: l.color, qty, unit_price: p.price, line_total: p.price * qty, stock: stockOf(p), max_qty: maxQtyOf(p) }];
  });
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const delivery = deliveryFor(subtotal, shipping);
  return { items, count: items.reduce((s, i) => s + i.qty, 0), subtotal, delivery, total: subtotal + delivery };
}

// Validates one cart/order line the way the server would; returns the raw product.
function checkLine({ product_id, size, color, qty }, field = "") {
  const p = RAW.get(Number(product_id));
  if (!p) throw invalid({ [`${field}product_id`]: ["This product does not exist."] });
  if (stockOf(p) <= 0) throw invalid({ [`${field}product_id`]: [`${productName(p)} is out of stock.`] }, `${productName(p)} is out of stock.`);
  const sizes = p.sizes?.length ? p.sizes : ["ONE"];
  if (!sizes.includes(size)) throw invalid({ [`${field}size`]: [`Choose a valid size for ${productName(p)}.`] });
  const colors = (p.colors || []).map((c) => c.name);
  if (colors.length && !colors.includes(color)) throw invalid({ [`${field}color`]: [`Choose a valid colour for ${productName(p)}.`] });
  if (qty !== undefined && (!Number.isInteger(qty) || qty < 1)) throw invalid({ [`${field}qty`]: ["Quantity must be at least 1."] });
  return p;
}

function addToCart(u, db, { product_id, size, color, qty }) {
  const p = checkLine({ product_id, size, color, qty });
  const limit = maxQtyOf(p);
  const line = u.cart.find((l) => l.productId === p.id && l.size === size && l.color === (color ?? ""));
  const total = (line?.qty ?? 0) + qty;
  if (total > limit) throw invalid({ qty: [`Maximum ${limit} allowed`] }, `Maximum ${limit} allowed`);
  if (line) line.qty = total;
  else u.cart.push({ id: nextId(db), productId: p.id, size, color: color ?? "", qty });
}

// Orders move pending -> processing -> shipped -> delivered on a short timer so the account page can be tried end to end.
// Every step is written to o.history with the time it was reached (this feeds the order tracking timeline).
const STAGES = [["pending", 0], ["processing", 1], ["shipped", 5], ["delivered", 10]]; // [status, minutes after the order was placed]
const CANCELLABLE = ["pending", "processing"]; // once an order is shipped it can no longer be cancelled (use return / exchange after delivery)
function advance(o, now = Date.now()) {
  if (o.status === "delivered" || o.status === "cancelled" || o.sample) return false;
  const created = Date.parse(o.created_at);
  const mins = (now - created) / 60_000;
  o.history ||= [{ status: "pending", at: o.created_at }];
  for (const [s, m] of STAGES) {
    if (mins >= m && !o.history.some((h) => h.status === s)) o.history.push({ status: s, at: new Date(created + m * 60_000).toISOString() });
  }
  const next = o.history[o.history.length - 1].status;
  if (next === o.status) return false;
  o.status = next;
  if (next === "delivered") o.delivered_on = new Date(now).toISOString().slice(0, 10);
  return true;
}
const orderJson = (o) => ({ id: o.id, order_number: o.order_number, date: o.created_at, created_at: o.created_at, status: o.status, payment_status: o.payment_status,
  subtotal: o.subtotal, delivery: o.delivery, total: o.total, items_count: o.items.reduce((s, i) => s + i.qty, 0), delivered_on: o.delivered_on ?? null,
  shipping: o.shipping, payment_method: o.payment_method, address: o.address, return_request: o.return_request ?? null,
  items: o.items.map((i) => { const p = RAW.get(i.product_id); return { product_id: i.product_id, name: p ? productName(p) : "", image: p?.image ?? "", size: i.size, color: i.color, qty: i.qty, unit_price: i.unit_price }; }),
  history: o.history ?? [{ status: o.status, at: o.delivered_on ? `${o.delivered_on}T12:00:00.000Z` : o.created_at }],
  cancelled_at: o.cancelled_at ?? null, cancel_reason: o.cancel_reason ?? null,
  receiver_name: o.receiver_name ?? null, receiver_phone: o.receiver_phone ?? null, receiver_email: o.receiver_email ?? null, district: o.district ?? null,
  note: o.note ?? null, sender_number: o.sender_number ?? null, trx_id: o.trx_id ?? null });

// A brand-new mock account gets two past orders so the history, "buy again" and return flow can be tried.
function seedOrders(u, db) {
  const mk = (daysAgo, deliveredAgo, ids) => {
    const items = ids.map((id) => ({ product_id: id, size: (RAW.get(id).sizes || ["ONE"])[0], color: RAW.get(id).colors?.[0]?.name ?? "", qty: 1, unit_price: RAW.get(id).price }));
    const subtotal = items.reduce((s, i) => s + i.unit_price, 0), delivery = deliveryFor(subtotal, "standard");
    const created = new Date(Date.now() - daysAgo * DAY).toISOString();
    const t0 = Date.now() - daysAgo * DAY, t3 = Date.now() - deliveredAgo * DAY, iso = (t) => new Date(t).toISOString();
    const history = [{ status: "pending", at: iso(t0) }, { status: "processing", at: iso(t0 + 4 * 3_600_000) }, { status: "shipped", at: iso(t0 + (t3 - t0) / 2) }, { status: "delivered", at: iso(t3) }];
    return { id: nextId(db), order_number: `AVN-${db.seq}`, created_at: created, status: "delivered", sample: true, payment_status: "paid", subtotal, delivery, total: subtotal + delivery,
      shipping: "standard", payment_method: "cod", address: "House 12, Road 5, Dhanmondi, Dhaka", district: "Dhaka", receiver_name: u.name, receiver_phone: u.phone || null, receiver_email: u.email, items, history, delivered_on: new Date(t3).toISOString().slice(0, 10), return_request: null };
  };
  const ids = V2_PRODUCTS.filter((p) => stockOf(p) > 0).map((p) => p.id);
  u.orders.push(mk(14, 12, ids.slice(0, 2)), mk(5, 2, ids.slice(2, 3)));
}

// First order of a referred friend: credit both sides exactly once.
function creditReferral(u, db) {
  if (!u.referral.referredBy || u.referral.rewarded) return;
  u.referral.rewarded = true;
  u.referral.ledger.forEach((l) => { if (l.kind === "invited" && l.status === "pending") l.status = "credited"; });
  const inviter = Object.values(db.users).find((x) => x.referral.code === u.referral.referredBy);
  if (inviter) {
    const inv = inviter.referral.invites.find((i) => i.user_id === u.id);
    if (inv) inv.status = "credited";
    inviter.referral.ledger.push({ id: `inviter:${u.id}`, kind: "inviter", amount: REFERRAL_REWARD, status: "credited" });
  }
}

const refErr = (reason) => {
  const msg = { invalid_format: "Enter a valid code like AVN-K7M2P.", unknown: "We could not find this referral code.", own_code: "You cannot use your own referral code.", already_used: "A referral code was already used on this account." }[reason];
  return new ApiError(msg, { status: 422, errors: { referral: [msg], code: [msg] }, reason });
};
function applyReferral(u, db, raw) {
  const code = String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!CODE_RE.test(code)) throw refErr("invalid_format");
  if (code === u.referral.code) throw refErr("own_code");
  if (u.referral.referredBy) throw refErr("already_used");
  // Mock only: any well-formed code is accepted so the flow can be tried with one browser. The real API answers "unknown" for codes that do not exist.
  u.referral.referredBy = code;
  u.referral.ledger.push({ id: `invited:${code}`, kind: "invited", amount: REFERRAL_REWARD, status: "pending" });
  const inviter = Object.values(db.users).find((x) => x.referral.code === code);
  if (inviter) inviter.referral.invites.push({ id: String(nextId(db)), user_id: u.id, name: u.name, status: "pending", at: new Date().toISOString() });
}

const wishlistGuard = (u, id) => { if (!RAW.has(id)) throw notFound("This product does not exist."); return u; };

// ---------- the API ------------------------------------------------------------
const api = {
  auth: {
    async register(b) {
      return tx((db) => {
        const errors = {};
        const name = String(b.name ?? "").trim(), email = String(b.email ?? "").trim().toLowerCase();
        if (name.length < 2 || name.length > 80) errors.name = ["Please enter your full name."];
        if (!EMAIL_RE.test(email)) errors.email = ["Enter a valid email address."];
        else if (Object.values(db.users).some((u) => u.email === email)) errors.email = ["This email is already registered. Try logging in."];
        if (String(b.password ?? "").length < 8) errors.password = ["Use at least 8 characters."];
        if (b.passwordConfirmation !== b.password) errors.password_confirmation = ["The passwords do not match."];
        if (b.terms !== true) errors.terms = ["Please accept the terms to continue."];
        const ref = String(b.referral ?? "").trim();
        if (ref && !CODE_RE.test(ref.toUpperCase().replace(/\s+/g, ""))) throw refErr("invalid_format");
        if (Object.keys(errors).length) throw invalid(errors);
        const u = { id: nextId(db), name, email, hash: hash(b.password), phone: "", cart: [], wishlist: [], alerts: { prefs: null, items: [] }, orders: [], addresses: [], sizePassport: null,
          referral: { code: makeCode(db), referredBy: null, invites: [], ledger: [], rewarded: false } };
        if (ref) applyReferral(u, db, ref);
        seedOrders(u, db);
        db.users[u.id] = u;
        const t = token(); db.sessions[t] = u.id;
        tokenStore.set(t);
        return { token: t, user: A.toUser(userJson(u)) };
      });
    },
    async login(b) {
      return tx((db) => {
        const email = String(b.email ?? "").trim().toLowerCase();
        const u = Object.values(db.users).find((x) => x.email === email);
        if (!u || u.hash !== hash(b.password ?? "")) throw new ApiError("The email or password is incorrect.", { status: 422, errors: { email: ["The email or password is incorrect."] } });
        const t = token(); db.sessions[t] = u.id;
        tokenStore.set(t);
        return { token: t, user: A.toUser(userJson(u)) };
      });
    },
    async logout() { tx((db) => { const t = tokenStore.get(); if (t) delete db.sessions[t]; }); tokenStore.clear(); },
    async me() { return A.toUser(userJson(authed(read()))); },
  },

  catalog: {
    async list(params = {}, { lang: l = "bn" } = {}) {
      const items = buildCatalog(MSG[l] ?? bn, l);
      return { items, meta: { page: 1, limit: items.length, total: items.length, last_page: 1 } };
    },
    async listAll(params = {}, opts = {}) { return (await this.list(params, opts)).items; },
    async get(id, { lang: l = "bn" } = {}) { return findProduct(buildCatalog(MSG[l] ?? bn, l), id); },
    async related(id, { limit = 4, lang: l = "bn" } = {}) {
      const all = buildCatalog(MSG[l] ?? bn, l);
      const p = findProduct(all, id);
      return p ? relatedProducts(all, p, limit) : [];
    },
    async reviews() { return { items: [], meta: { page: 1, limit: 10, total: 0, last_page: 1 } }; }, // the product page shows its own demo reviews
    async categories({ lang: l = "bn" } = {}) { return V2_CATEGORIES.map((c) => A.toCategory({ key: c.key, name: (MSG[l] ?? bn).cats.names[c.key], image: c.image })); },
    async genders({ lang: l = "bn" } = {}) { return V2_GENDERS.map((g) => A.toGender({ key: g.key, name: (MSG[l] ?? bn).cats.genders[g.key], off: g.off, image: g.image })); },
  },

  cart: {
    async get({ shipping } = {}) { return A.toCart(cartJson(authed(read()), shipping)); },
    async add({ productId, size, color, qty }) {
      return tx((db) => { const u = authed(db); addToCart(u, db, { product_id: productId, size, color, qty }); return A.toCart(cartJson(u)); });
    },
    async addOutfit(items) {
      return tx((db) => {
        const u = authed(db);
        if (!Array.isArray(items) || !items.length) throw invalid({ items: ["Add at least one piece."] });
        const draft = JSON.parse(JSON.stringify(u.cart)); // all-or-nothing: roll back if one piece is invalid
        try { for (const i of items) addToCart(u, db, { product_id: i.productId, size: i.size, color: i.color, qty: 1 }); }
        catch (e) { u.cart = draft; throw e; }
        return A.toCart(cartJson(u));
      });
    },
    async setQty(itemId, qty) {
      return tx((db) => {
        const u = authed(db);
        const line = u.cart.find((l) => l.id === itemId);
        if (!line) throw notFound("This item is no longer in your cart.");
        const limit = maxQtyOf(RAW.get(line.productId));
        if (!Number.isInteger(qty) || qty < 1 || qty > limit) throw invalid({ qty: [`Quantity must be between 1 and ${limit}.`] });
        line.qty = qty;
        return A.toCart(cartJson(u));
      });
    },
    async remove(itemId) { return tx((db) => { const u = authed(db); u.cart = u.cart.filter((l) => l.id !== itemId); return A.toCart(cartJson(u)); }); },
    async clear() { return tx((db) => { authed(db).cart = []; return A.toCart({}); }); },
  },

  wishlist: {
    async get() { return { ids: [...authed(read()).wishlist] }; },
    async add(productId) { tx((db) => { const u = wishlistGuard(authed(db), productId); if (!u.wishlist.includes(productId)) u.wishlist.push(productId); }); },
    async remove(productId) { tx((db) => { const u = authed(db); u.wishlist = u.wishlist.filter((x) => x !== productId); u.alerts.items = u.alerts.items.filter((a) => a.product_id !== productId); }); }, // no wishlist item, no price alert
  },

  priceAlerts: {
    async get() { const u = authed(read()); return A.toAlerts({ prefs: u.alerts.prefs, items: u.alerts.items }); },
    async savePrefs(p) {
      return tx((db) => {
        const errors = {};
        const phone = phoneOf(p.phone), email = String(p.emailAddr ?? "").trim();
        if (!p.sms && !p.email) errors.sms = ["Choose SMS, email or both."];
        if (p.sms && !PHONE_RE.test(phone)) errors.phone = ["Enter a valid Bangladeshi mobile number."];
        if (p.email && !EMAIL_RE.test(email)) errors.email_addr = ["Enter a valid email address."];
        if (Object.keys(errors).length) throw invalid(errors);
        const u = authed(db);
        u.alerts.prefs = { sms: Boolean(p.sms), email: Boolean(p.email), phone: p.sms ? phone : "", email_addr: p.email ? email : "" };
        return A.toPrefs(u.alerts.prefs);
      });
    },
    async enable(productId, basePrice) {
      tx((db) => {
        const u = authed(db);
        if (!RAW.has(productId)) throw notFound("This product does not exist.");
        if (!Number.isFinite(basePrice) || basePrice <= 0) throw invalid({ base_price: ["Enter a price above zero."] });
        const row = u.alerts.items.find((a) => a.product_id === productId);
        if (row) row.base_price = basePrice; else u.alerts.items.push({ product_id: productId, base_price: basePrice, since: new Date().toISOString() });
      });
    },
    async disable(productId) { tx((db) => { const u = authed(db); u.alerts.items = u.alerts.items.filter((a) => a.product_id !== productId); }); },
  },

  orders: {
    async place({ form, items, shipping }) {
      const b = A.fromOrderForm({ form, items, shipping }); // exactly what the real API receives
      return tx((db) => {
        const u = authed(db);
        const e = {};
        if (b.name.length < 3) e.name = ["Please enter the receiver's full name."];
        if (!PHONE_RE.test(b.phone)) e.phone = ["Enter a valid Bangladeshi mobile number."];
        if (b.email && !EMAIL_RE.test(b.email)) e.email = ["Enter a valid email address."];
        if (!DISTRICTS.includes(b.district)) e.district = ["Please choose a district."];
        if (b.address.length < 8) e.address = ["Please enter the full address."];
        if (!["standard", "express"].includes(b.shipping)) e.shipping = ["Choose a delivery option."];
        if (!["cod", "bkash", "nagad", "rocket", "bank"].includes(b.payment_method)) e.payment_method = ["Choose a payment method."];
        const mfs = ["bkash", "nagad", "rocket"].includes(b.payment_method);
        if (mfs && String(b.sender_number ?? "").length < 11) e.sender_number = ["Enter the number you paid from."];
        if (b.payment_method !== "cod" && String(b.trx_id ?? "").length < 6) e.trx_id = ["Enter the transaction ID (at least 6 characters)."];
        if (!b.items.length) e.items = ["Your cart is empty."];
        if (Object.keys(e).length) throw invalid(e);

        const lines = b.items.map((l, i) => {
          const p = checkLine(l, `items.${i}.`);
          if (l.qty > maxQtyOf(p)) throw invalid({ [`items.${i}.qty`]: [`Only ${maxQtyOf(p)} of ${productName(p)} available.`] }, `Only ${maxQtyOf(p)} of ${productName(p)} available.`);
          return { product_id: p.id, size: l.size, color: l.color ?? "", qty: l.qty, unit_price: p.price };
        });
        const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0); // the server never trusts client prices
        const delivery = deliveryFor(subtotal, b.shipping);
        const id = nextId(db);
        const order = { id, order_number: `AVN-${id}`, created_at: new Date().toISOString(), status: "pending", payment_status: b.payment_method === "cod" ? "unpaid" : "pending_verification",
          subtotal, delivery, total: subtotal + delivery, shipping: b.shipping, payment_method: b.payment_method, address: `${b.address}, ${b.district}`, items: lines, delivered_on: null, return_request: null,
          receiver_name: b.name, receiver_phone: b.phone, receiver_email: b.email ?? null, district: b.district, note: b.note ?? null, sender_number: b.sender_number ?? null, trx_id: b.trx_id ?? null,
          history: [{ status: "pending", at: new Date().toISOString() }] };
        u.orders.unshift(order);
        u.cart = [];
        if (u.orders.filter((o) => !o.sample).length === 1) creditReferral(u, db);
        return A.toOrder(orderJson(order));
      });
    },
    async list() { return tx((db) => { const u = authed(db); u.orders.forEach((o) => advance(o)); return [...u.orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((o) => A.toOrder(orderJson(o))); }); },
    // E42: one order (tracking page, cancel page)
    async get(id) {
      return tx((db) => {
        const u = authed(db);
        const o = u.orders.find((x) => String(x.id) === String(id));
        if (!o) throw notFound("Order not found.");
        advance(o);
        return A.toOrder(orderJson(o));
      });
    },
    // E43: cancel an order that has not shipped yet
    async cancel(id, { reason, note } = {}) {
      return tx((db) => {
        const u = authed(db);
        const o = u.orders.find((x) => String(x.id) === String(id));
        if (!o) throw notFound("Order not found.");
        advance(o);
        if (o.status === "cancelled") throw invalid({ order: ["This order is already cancelled."] }, "This order is already cancelled.");
        if (!CANCELLABLE.includes(o.status)) throw invalid({ order: ["This order has already been shipped, so it can no longer be cancelled."] }, "This order has already been shipped, so it can no longer be cancelled.");
        if (!String(reason ?? "").trim()) throw invalid({ reason: ["Please choose a reason."] });
        if (String(note ?? "").length > 400) throw invalid({ note: ["Keep the note under 400 characters."] });
        const at = new Date().toISOString();
        o.status = "cancelled";
        o.cancelled_at = at;
        o.cancel_reason = String(reason);
        o.history = [...(o.history ?? []), { status: "cancelled", at, note: String(reason) }];
        if (o.payment_method !== "cod") o.payment_status = "refund_pending"; // the customer already sent money: it is returned after cancellation
        return A.toOrder(orderJson(o));
      });
    },
    async requestReturn(id, { type, reason, note }) {
      return tx((db) => {
        const u = authed(db);
        const o = u.orders.find((x) => x.id === id);
        if (!o) throw notFound("Order not found.");
        advance(o);
        if (!["return", "exchange"].includes(type)) throw invalid({ type: ["Choose return or exchange."] });
        if (!String(reason ?? "").trim()) throw invalid({ reason: ["Please choose a reason."] });
        if (String(note ?? "").length > 400) throw invalid({ note: ["Keep the note under 400 characters."] });
        if (o.status !== "delivered" || !o.delivered_on) throw invalid({ order: ["Only delivered orders can be returned."] }, "Only delivered orders can be returned.");
        const deadline = new Date(`${o.delivered_on}T23:59:59`).getTime() + RETURN_WINDOW_DAYS * DAY;
        if (Date.now() > deadline) throw invalid({ order: ["The return window for this order has closed."] }, "The return window for this order has closed.");
        if (o.return_request) throw invalid({ order: ["A request already exists for this order."] }, "A request already exists for this order.");
        o.return_request = { type, status: "requested", reason: String(reason), note: String(note ?? "") };
        return A.toReturnRequest(o.return_request);
      });
    },
  },

  user: {
    async profile() { return A.toUser(userJson(authed(read()))); },
    async updateProfile({ name, email, phone }) {
      return tx((db) => {
        const u = authed(db);
        const e = {}, mail = String(email ?? "").trim().toLowerCase(), tel = phoneOf(phone);
        if (String(name ?? "").trim().length < 2) e.name = ["Please enter your full name."];
        if (!EMAIL_RE.test(mail)) e.email = ["Enter a valid email address."];
        else if (Object.values(db.users).some((x) => x.id !== u.id && x.email === mail)) e.email = ["This email is already used by another account."];
        if (!PHONE_RE.test(tel)) e.phone = ["Enter a valid Bangladeshi mobile number."];
        if (Object.keys(e).length) throw invalid(e);
        u.name = String(name).trim(); u.email = mail; u.phone = tel.replace(/^\+?88/, "");
        return A.toUser(userJson(u));
      });
    },
    addresses: {
      async list() { return authed(read()).addresses.map(A.toAddress); },
      async add({ type, address, city, phone }) {
        return tx((db) => {
          const u = authed(db), e = {};
          if (String(type ?? "").trim().length < 2) e.type = ["Enter a label such as Home or Office."];
          if (String(address ?? "").trim().length < 6) e.address = ["Please enter the full address."];
          if (String(city ?? "").trim().length < 2) e.city = ["Please enter the city."];
          if (phone && !PHONE_RE.test(phoneOf(phone))) e.phone = ["Enter a valid Bangladeshi mobile number."];
          if (Object.keys(e).length) throw invalid(e);
          u.addresses.push({ id: nextId(db), type: String(type).trim(), address: String(address).trim(), city: String(city).trim(), phone: phone ? phoneOf(phone) : "", is_default: u.addresses.length === 0 });
          return u.addresses.map(A.toAddress);
        });
      },
      async setDefault(id) { return tx((db) => { const u = authed(db); if (!u.addresses.some((a) => a.id === id)) throw notFound("Address not found."); u.addresses.forEach((a) => { a.is_default = a.id === id; }); return u.addresses.map(A.toAddress); }); },
      async remove(id) {
        return tx((db) => {
          const u = authed(db);
          u.addresses = u.addresses.filter((a) => a.id !== id);
          if (u.addresses.length && !u.addresses.some((a) => a.is_default)) u.addresses[0].is_default = true;
          return u.addresses.map(A.toAddress);
        });
      },
    },
    sizePassport: {
      async get() { return A.toSizePassport(authed(read()).sizePassport || {}); },
      async save(p) {
        return tx((db) => {
          const u = authed(db), e = {}, out = {};
          const body = A.fromSizePassport(p);
          for (const [k, [lo, hi]] of Object.entries(RANGES)) {
            if (body[k] === null) { out[k] = null; continue; }
            if (body[k] < lo || body[k] > hi) e[k] = [`Enter a value between ${lo} and ${hi}.`]; else out[k] = body[k];
          }
          if (!e.chest && !e.weight && !e.age && !out.chest && !out.weight && !out.age) e.chest = ["Add your chest, weight or child's age."];
          if (Object.keys(e).length) throw invalid(e);
          u.sizePassport = out;
          return A.toSizePassport(out);
        });
      },
      async clear() { tx((db) => { authed(db).sizePassport = null; }); },
    },
  },

  referrals: {
    async me() {
      return tx((db) => {
        const u = authed(db);
        return A.toReferral({ code: u.referral.code, referred_by: u.referral.referredBy, invites: u.referral.invites.map(({ id, name, status, at }) => ({ id, name, status, at })), ledger: u.referral.ledger });
      });
    },
    async apply(code) { tx((db) => applyReferral(authed(db), db, code)); },
  },

  support: {
    async send({ name, contact, order, topic, message }) {
      return tx((db) => {
        const e = {}, c = String(contact ?? "").trim();
        if (String(name ?? "").trim().length < 2) e.name = ["Please enter your name."];
        if (!(EMAIL_RE.test(c) || c.replace(/\D/g, "").length >= 8)) e.contact = ["Enter a valid email or phone number."];
        if (order && !/^#?AVN-\d{3,}$/i.test(String(order).trim())) e.order = ["Use the format #AVN-0000."];
        if (!A.SUPPORT_TOPICS.includes(topic)) e.topic = ["Please choose a topic."];
        if (String(message ?? "").trim().length < 10) e.message = ["Please write at least 10 characters."];
        if (Object.keys(e).length) throw invalid(e);
        const id = nextId(db);
        db.support.push({ id, name, contact: c, order: order || null, topic, message, at: new Date().toISOString() });
        return { reference: `SUP-${String(id).padStart(5, "0")}` };
      });
    },
  },
  newsletter: {
    async subscribe(email) {
      tx((db) => {
        const m = String(email ?? "").trim().toLowerCase();
        if (!EMAIL_RE.test(m)) throw invalid({ email: ["Enter a valid email address."] });
        if (!db.newsletter.includes(m)) db.newsletter.push(m); // already subscribed -> still success
      });
    },
  },
  campaigns: { async list() { return CAMPAIGN_FALLBACK; } },
  settings: {
    async get() {
      return A.toSettings({ currency: "BDT", free_delivery_over: FREE_DELIVERY_OVER, delivery_fee: DELIVERY_FEE, express_fee: EXPRESS_FEE, max_qty_per_line: MAX_QTY,
        return_window_days: RETURN_WINDOW_DAYS, referral_reward: REFERRAL_REWARD, points_per_taka: POINTS_PER_TAKA, districts: DISTRICTS,
        support: { phone: SUPPORT.phone, phone_label: SUPPORT.phoneLabel, whatsapp: SUPPORT.whatsapp, email: SUPPORT.email },
        payment_accounts: { bkash: PAYMENT_ACCOUNTS.bkash, nagad: PAYMENT_ACCOUNTS.nagad, rocket: PAYMENT_ACCOUNTS.rocket,
          bank: { bank_name: PAYMENT_ACCOUNTS.bank.bankName, account_name: PAYMENT_ACCOUNTS.bank.accName, account_number: PAYMENT_ACCOUNTS.bank.accNo, branch: PAYMENT_ACCOUNTS.bank.branch, routing: PAYMENT_ACCOUNTS.bank.routing } } });
    },
  },
};

// Artificial latency (browser only) so loading and error states can be seen while building the UI.
const wait = () => (typeof window !== "undefined" && MOCK_LATENCY > 0 ? new Promise((r) => setTimeout(r, MOCK_LATENCY)) : Promise.resolve());
function slow(node) {
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    out[k] = typeof v === "function" ? async function (...a) { await wait(); return v.apply(node, a); } : slow(v);
  }
  return out;
}
export const mockApi = slow(api);
export { MAX_QTY as MOCK_MAX_QTY };
