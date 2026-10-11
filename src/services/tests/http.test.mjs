// REAL-API client tests against a fake Laravel-style server (checks paths, headers, payloads and adapters).
// Run:  node --import ./src/services/tests/register.mjs src/services/tests/http.test.mjs
process.env.NEXT_PUBLIC_API_URL = "https://api.test/api";
const { api, USE_MOCK, ApiError, tokenStore } = await import("@/services/index.js");
const { buildCatalog } = await import("@/lib/v2/catalog.js");
const { toCatalogItem } = await import("@/services/adapters.js");
const { V2_PRODUCTS } = await import("@/data/v2.js");
const en = (await import("@/messages/v2/en.js")).default;
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : (fail++, console.log("FAIL:", n, x)); };
ok("real mode selected", USE_MOCK === false);

// --- fake server (snake_case, wrapped in {data}, exactly like the spec)
const calls = [];
const db = { cart: [], token: "tok123" };
const rowOf = (x) => ({ id: x.id, name: en.products.items[x.key], name_en: en.products.items[x.key], description: en.products.desc[x.key], category: x.category, category_label: en.cats.names[x.category],
  genders: x.genders, tags: x.tags, sizes: x.sizes, colors: (x.colors || []).map((c) => ({ ...c, family: "x" })), stock: x.stock ?? 10, price: x.price, mrp: x.mrp ?? null, rating: x.rating, reviews_count: x.reviews, sku: `AVN-${String(x.id).padStart(4, "0")}`, image: x.image, images: [x.image], hover_image: null, aliases: x.aliases });
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); const body = init.body ? JSON.parse(init.body) : undefined; const m = init.method || "GET";
  calls.push({ m, path: u.pathname + u.search, auth: init.headers.Authorization, lang: init.headers["Accept-Language"], body });
  const json = (status, data) => ({ ok: status < 400, status, json: async () => data });
  const p = u.pathname.replace("/api", "");
  if (p === "/products" && m === "GET") { const page = Number(u.searchParams.get("page") || 1); const all = V2_PRODUCTS.map(rowOf); const lim = Number(u.searchParams.get("limit") || 10); const rows = all.slice((page - 1) * lim, page * lim); return json(200, { data: rows, meta: { page, limit: lim, total: all.length, last_page: Math.ceil(all.length / lim) } }); }
  if (/^\/products\/\d+$/.test(p)) { const x = V2_PRODUCTS.find((q) => String(q.id) === p.split("/")[2]); return x ? json(200, { data: { ...rowOf(x), material: "100% cotton" } }) : json(404, { message: "Not found" }); }
  if (p === "/auth/login") return body.password === "right" ? json(200, { token: "tok123", token_type: "Bearer", user: { id: 1, name: "A", email: body.email, phone: null, tier: "Gold", points: 1600, next_tier_points: 3000 } }) : json(422, { message: "These credentials do not match.", errors: { email: ["These credentials do not match."] } });
  if (p === "/auth/register") return json(422, { message: "invalid", errors: { referral: ["Unknown code"] }, reason: "unknown" });
  if (p === "/auth/me") return init.headers.Authorization === "Bearer tok123" ? json(200, { data: { id: 1, name: "A", email: "a@b.com", tier: "Gold", points: 1600, next_tier_points: 3000 } }) : json(401, { message: "Unauthenticated." });
  if (p === "/cart" && m === "GET") return json(200, { data: { items: db.cart, count: db.cart.reduce((s, i) => s + i.qty, 0), subtotal: 1000, delivery: u.searchParams.get("shipping") === "express" ? 250 : 100, total: 1100 } });
  if (p === "/cart/items" && m === "POST") { db.cart.push({ id: 77, product_id: body.product_id, name: "X", image: "/i.jpg", size: body.size, color: body.color, qty: body.qty, unit_price: 500, line_total: 500 * body.qty, stock: 8, max_qty: 8 }); return json(201, { data: { items: db.cart, count: body.qty, subtotal: 1000, delivery: 100, total: 1100 } }); }
  if (p === "/cart/items/77" && m === "DELETE") { db.cart = []; return { ok: true, status: 204, json: async () => { throw new Error("no body"); } }; }
  if (p === "/orders" && m === "POST") return json(201, { data: { id: 5, order_number: "AVN-9100", status: "pending", payment_status: "pending_verification", subtotal: 1000, delivery: 100, total: 1100, shipping: body.shipping, payment_method: body.payment_method, address: body.address, created_at: "2026-10-08T10:00:00+06:00", items: body.items } });
  if (p === "/orders" && m === "GET") return json(200, { data: [{ id: 5, order_number: "AVN-9100", status: "Delivered", total: 1100, items_count: 2, created_at: "2026-10-01T10:00:00+06:00", delivered_on: "2026-10-05", return_request: { type: "return", status: "requested" } }], meta: {} });
  if (p === "/wishlist") return json(200, { data: [{ id: 3 }, { id: 4 }] });
  if (p === "/price-alerts") return json(200, { prefs: { sms: true, email: false, phone: "01712345678", email_addr: null }, items: [{ product_id: 3, base_price: 900, since: "2026-10-01T00:00:00+06:00" }] });
  if (p === "/users/size-passport") return json(200, { data: { height: null, weight: 60, chest: null, waist: null, age: 7 } });
  if (p === "/referrals/me") return json(200, { data: { code: "AVN-K7M2P", referred_by: null, invites: [{ id: 1, name: "Sara", status: "pending", at: "2026-10-02" }], ledger: [{ id: 1, kind: "inviter", amount: 200, status: "pending" }] } });
  if (p === "/settings") return json(200, { data: { free_delivery_over: 4000, express_fee: 300, districts: ["Dhaka"], support: { phone: "+88011", phone_label: "+880 11", email: "s@a.com" }, payment_accounts: { bkash: { number: "017", type: "Merchant" }, bank: { bank_name: "B", account_name: "N", account_number: "1.2", branch: "Br", routing: "9" } } } });
  if (p === "/support") return json(201, { data: { reference: "SUP-00123" } });
  if (p === "/campaigns") return json(200, { data: [{ id: 1, type: "eid" }] });
  return json(404, { message: "no route " + p });
};

// catalog: adapter output must match the legacy buildCatalog output field by field
const real = (await api.catalog.list({ limit: 100 }, { lang: "en" })).items;
const legacy = buildCatalog(en, "en");
ok("same count", real.length > 0, `${real.length}`);
let diffs = [];
for (const k of ["id", "name", "description", "category", "categoryLabel", "genders", "genderLabels", "tags", "sizes", "image", "stock", "price", "mrp", "discount", "rating", "priceText", "mrpText", "discountText", "ratingText", "reviewsText", "sku", "reviewsCount", "haystack"]) {
  const norm = (v) => (k === "haystack" ? [...new Set(v.split(" "))].sort().join(" ") : JSON.stringify(v));
  real.forEach((r, i) => { if (norm(r[k]) !== norm(legacy[i][k])) diffs.push(`${i}:${k} real=${JSON.stringify(r[k])} legacy=${JSON.stringify(legacy[i][k])}`); });
}
ok("adapter output == legacy buildCatalog", diffs.length === 0, diffs.slice(0, 4).join("\n"));
const all = await api.catalog.listAll({}, { lang: "bn", pageSize: 7 }); ok("listAll paginates", all.length === V2_PRODUCTS.length && all[0].order === 0 && all.at(-1).order === all.length - 1, `${all.length}`);
ok("lang header sent", calls.at(-1).lang === "bn");
const prod = await api.catalog.get(3, { lang: "en" }); ok("detail + material", prod.material === "100% cotton");
ok("detail 404 -> null", (await api.catalog.get(9999, { lang: "en" })) === null);

// auth
try { await api.auth.login({ email: "a@b.com", password: "wrong" }); ok("login fail throws", false); } catch (e) { ok("login fail ApiError 422", e instanceof ApiError && e.status === 422 && e.field("email")); }
try { await api.auth.register({ name: "A", email: "a@b.com", password: "12345678", passwordConfirmation: "12345678", terms: true, referral: "AVN-AAAAA" }); } catch (e) { ok("register referral reason", e.reason === "unknown" && e.field("referral")); }
const lg = await api.auth.login({ email: "a@b.com", password: "right" }); ok("login ok + token stored", lg.user.tier === "Gold" && tokenStore.get() === "tok123");
ok("body mapped to snake_case", calls.find((c) => c.path === "/api/auth/register").body.password_confirmation === "12345678");
ok("me", (await api.auth.me()).points === 1600 && calls.at(-1).auth === "Bearer tok123");

// cart
let c = await api.cart.add({ productId: 3, size: "M", color: "Blue", qty: 2 });
ok("cart add mapped", c.items[0].itemId === 77 && c.items[0].productId === 3 && c.items[0].unitPrice === 500 && c.total === 1100 && calls.at(-1).body.product_id === 3);
c = await api.cart.remove(77); ok("204 -> refetch cart", c.items.length === 0 && calls.at(-1).path === "/api/cart");
ok("cart shipping query", (await api.cart.get({ shipping: "express" })).delivery === 250 && calls.at(-1).path === "/api/cart?shipping=express");

// orders
const o = await api.orders.place({ form: { name: "Sara A", phone: "01712-345678", email: "", district: "Dhaka", address: "House 1, Road 2", note: "", method: "bkash", sender: "01712-345678", trx: "ABC123" }, items: [{ productId: 3, size: "M", color: "Blue", qty: 2 }], shipping: "standard" });
const sent = calls.at(-1).body;
ok("order payload", sent.payment_method === "bkash" && sent.sender_number === "01712345678" && sent.trx_id === "ABC123" && sent.items[0].product_id === 3 && sent.phone === "01712345678" && sent.email === undefined, JSON.stringify(sent));
ok("order mapped", o.number === "AVN-9100" && o.paymentStatus === "pending_verification" && o.total === 1100);
const ol = await api.orders.list(); ok("orders list mapped (status lowercased, return_request)", ol[0].status === "delivered" && ol[0].deliveredOn === "2026-10-05" && ol[0].returnRequest.type === "return" && ol[0].itemsCount === 2);

// misc
ok("wishlist ids", JSON.stringify((await api.wishlist.get()).ids) === "[3,4]");
const al = await api.priceAlerts.get(); ok("alerts mapped", al.prefs.phone === "01712345678" && al.items["3"].basePrice === 900);
const sp = await api.user.sizePassport.get(); ok("passport mapped to strings", sp.age === 7 && sp.height === "" && sp.weight === 60);
const rf = await api.referrals.me(); ok("referral mapped", rf.code === "AVN-K7M2P" && rf.invites[0].status === "pending" && rf.ledger[0].amount === 200);
const st = await api.settings.get(); ok("settings mapped", st.freeDeliveryOver === 4000 && st.expressFee === 300 && st.paymentAccounts.bank.accNo === "1.2" && st.support.phoneLabel === "+880 11" && st.paymentAccounts.bkash.type === "Merchant");
ok("support ref", (await api.support.send({ name: "S", contact: "a@b.com", topic: "other", message: "hello there!!" })).reference === "SUP-00123");
ok("campaigns raw", (await api.campaigns.list())[0].type === "eid");

// 401 clears token + fires event
let fired = false; window.addEventListener("avenor:auth-expired", () => { fired = true; });
tokenStore.set("expired"); try { await api.auth.me(); } catch (e) { ok("401 -> ApiError", e.status === 401); }
ok("401 fires auth-expired + clears token", fired && tokenStore.get() === null);
// network error
globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
try { await api.settings.get(); ok("network error throws", false); } catch (e) { ok("network error status 0", e instanceof ApiError && e.status === 0 && e.isNetwork); }

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
