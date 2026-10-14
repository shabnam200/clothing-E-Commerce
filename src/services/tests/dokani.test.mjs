// Dokani Cloud adapter tests: a fake Dokani server that answers with the SAME shapes as the real responses (products, categories).
// Run:  node --import ./src/services/tests/register.mjs src/services/tests/dokani.test.mjs
process.env.NEXT_PUBLIC_MOCK_LATENCY = "0";
delete process.env.NEXT_PUBLIC_API_URL;
Object.assign(process.env, { DOKANI_BASE_URL: "https://app.dokani.cloud/api", DOKANI_LOGIN: "shop@it-lab.test", DOKANI_PASSWORD: "secret-pass", DOKANI_SHOP_ID: "552", DOKANI_BRANCH_ID: "494" });

const { listAll, get, related, categories, health, clearCatalogCache } = await import("@/services/dokani/catalog.js");
const { resetSession, DokaniError } = await import("@/services/dokani/client.js");
const { mapProduct, normSize, guessCategory } = await import("@/services/dokani/mapper.js");
const { isEnabled } = await import("@/services/dokani/config.js");

let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : (fail++, console.log("FAIL:", n, x)); };
const rejects = async (n, fn, check) => { try { await fn(); ok(n, false, "did not throw"); } catch (e) { ok(n, !check || check(e), `${e.name}: ${e.message}`); } };

// ---- fake Dokani (shapes copied from the real IT lab responses)
const base = (id, name, model, size, mrp, shop, cat, catId, unit, stock, extra = {}) => ({
  name, model, size, id, barcode: `649988${id}`, description: null, created_at: "12-10-2026", avg_buy_price: "450.00000", last_buy_price: "450.00000", status: 1, is_service: 0, has_serial_no: 0,
  has_vat: false, vat_percentage: null, has_discount: false, discount_type: "percentage", discount_value: null, cover_image: null, cover_image_url: null, feature_images: null, feature_image_urls: [],
  pack_per_box: 1, pice_per_pack: 1, warranty: "", alarming_stock: 0, mrp: `${mrp}.00000`, whole_sale_price: "650.00000", shop_price: `${shop}.00000`,
  category: { name: cat, id: catId }, company: { name: "Avenor Local", id: 1 }, unit: { name: unit, id: 1 }, stock: { stock_amount: stock },
  is_size: false, is_colour: false, variant_status: 0, serial_nos: [], sizes: [], colours: [], variants: [], ...extra,
});
const PRODUCTS = [
  base(1, "Premium Cotton Polo T-Shirt", "SS-POLO-01", "M", 850, 800, "Men's Clothing", 1, "Piece", 1),
  base(2, "Slim Fit Denim Jeans", "DNM-SLIM-32", "32", 1500, 1400, "Pants", 2, "Piece", 0),
  base(3, "Casual Zipper Hoodie", "WIN-HD-05", "L", 1200, 1150, "Winterwear", 3, "Piece", 0),
  base(4, "Active Running Shoes", "SNK-RUN-01", "42", 2500, 2400, "Footwear", 4, "Pair", 0),
  base(5, "Premium Cotton Panjabi", "PNJ-COT-99", "XL", 1800, 1750, "Men's Clothing", 1, "Piece", 0),
  base(6, "Classic Leather Wallet", "LTH-WAL-05", "Free", 1200, 1100, "Accessories", 5, "Piece", 0),
];
const CATS = [[1, "Men's Clothing"], [2, "Pants"], [3, "Winterwear"], [4, "Footwear"], [5, "Accessories"]].map(([id, name]) => ({ id, name, status: 1, user_id: 845, shop_id: 552 }));

const S = { logins: 0, productCalls: 0, token: "tok1", expireOldTokens: false, products: PRODUCTS, productsBody: null, categoryRows: CATS, loginOk: true, auth: [], bodies: [] };
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url), path = u.pathname.replace("/api", "");
  const json = (status, data) => ({ ok: status < 400, status, json: async () => data });
  if (path === "/login/") {
    S.logins++; S.bodies.push(init.body);
    if (!S.loginOk) return json(401, { status: false, message: "Invalid credentials" });
    S.token = `tok${S.logins}`;
    return json(200, { status: true, token: S.token, user_name: "Amina", user_slug: "amina.begum0222", currency: "BDT" });
  }
  const bearer = init.headers?.Authorization;
  S.auth.push(bearer);
  if (S.expireOldTokens && bearer !== `Bearer tok${S.logins}`) return json(401, { message: "Unauthenticated." });
  if (path === "/shops/category") return json(200, { success: true, category: S.categoryRows, title: "DokaniCloud | Categorys" });
  if (path === "/shops/products") { S.productCalls++; const page = Number(u.searchParams.get("page") || 1); return json(200, S.productsBody ? S.productsBody(page) : { success: true, products: S.products, title: "DokaniCloud | Products" }); }
  return json(404, { message: "no route" });
};
const fresh = () => { clearCatalogCache(); resetSession(); S.logins = 0; S.productCalls = 0; S.auth = []; S.bodies = []; S.expireOldTokens = false; S.productsBody = null; S.products = PRODUCTS; S.categoryRows = CATS; S.loginOk = true; };

ok("enabled when env is set", isEnabled() === true);

// ---- mapping of the real IT lab products
fresh();
const items = await listAll({}, { lang: "en" });
const by = Object.fromEntries(items.map((p) => [p.id, p]));
ok("six products", items.length === 6 && items.every((p) => p.source === "dokani"));
ok("polo: tshirts, men (from 'Men's Clothing'), size M, 800 / 850, stock 1", by[1].category === "tshirts" && JSON.stringify(by[1].genders) === '["men"]' && JSON.stringify(by[1].sizes) === '["M"]' && by[1].price === 800 && by[1].mrp === 850 && by[1].stock === 1 && by[1].tags.includes("sale"), JSON.stringify(by[1]).slice(0, 400));
ok("jeans: category from name, waist size 32, unisex default", by[2].category === "jeans" && JSON.stringify(by[2].sizes) === '["32"]' && JSON.stringify(by[2].genders) === '["men","women"]' && by[2].stock === 0 && by[2].price === 1400);
ok("hoodie -> jackets", by[3].category === "jackets" && by[3].sizes[0] === "L");
ok("shoes -> accessories, size 42", by[4].category === "accessories" && by[4].sizes[0] === "42");
ok("panjabi -> kurtas, XL, men", by[5].category === "kurtas" && by[5].sizes[0] === "XL" && by[5].genders[0] === "men");
ok("wallet: 'Free' size becomes ONE", by[6].category === "accessories" && JSON.stringify(by[6].sizes) === '["ONE"]');
ok("no photo -> a category picture that already ships with the site", by[1].image === "/v2/categories/tees.png" && by[2].image === "/v2/categories/jeans.png" && by[1].images.length === 1 && by[1].hasPhoto === false, by[1].image);
ok("UI fields present", by[1].priceText.startsWith("৳") && by[1].haystack.includes("premium cotton polo t-shirt") && by[1].sku === "6499881" && by[1].rating === 0);
ok("login: ONE form-data call with login + password", S.logins === 1 && S.bodies[0] instanceof FormData && S.bodies[0].get("login") === "shop@it-lab.test" && S.bodies[0].get("password") === "secret-pass");
ok("Bearer token sent on data calls", S.auth.length > 0 && S.auth.every((a) => a === "Bearer tok1"));

// ---- caching + single login
const before = S.productCalls;
await listAll({}, { lang: "bn" });
ok("second read within a minute uses the cache (no new Dokani call)", S.productCalls === before);
fresh();
await Promise.all([listAll({}, { lang: "en" }), categories(), get(1, { lang: "en" })]);
ok("parallel requests share ONE login", S.logins === 1, String(S.logins));

// ---- 401 -> automatic re-login
fresh();
await listAll({}, { lang: "en" });
clearCatalogCache(); S.expireOldTokens = true; S.logins = 5; // the server has since issued newer tokens, so the cached "tok1" is now rejected with 401
const before401 = S.logins;
const again = await listAll({}, { lang: "en" });
ok("401 triggers one fresh login and the call still succeeds", again.length === 6 && S.logins === before401 + 1, `logins ${S.logins}`);

// ---- safety: wrong shop / bad login
fresh(); S.categoryRows = CATS.map((c) => ({ ...c, shop_id: 999 }));
await rejects("wrong shop is refused", () => listAll({}, { lang: "en" }), (e) => /Wrong Dokani shop/.test(e.message) && /999/.test(e.message) && /552/.test(e.message));
fresh(); S.loginOk = false;
await rejects("bad login gives a clear message", () => listAll({}, { lang: "en" }), (e) => e instanceof DokaniError && /Invalid credentials/.test(e.message));
fresh();

// ---- filtering + pagination
S.products = [...PRODUCTS, base(7, "Old Item", "OLD", "M", 100, 90, "Pants", 2, "Piece", 5, { status: 0 }), base(8, "Delivery Service", "SRV", "", 100, 100, "Accessories", 5, "Piece", 0, { is_service: 1 })];
ok("inactive products and services are hidden", (await listAll({}, { lang: "en" })).length === 6);
fresh();
const all250 = Array.from({ length: 250 }, (_, i) => base(i + 1, `Shirt ${i + 1}`, `M${i}`, "M", 500, 450, "Men's Clothing", 1, "Piece", 3));
S.productsBody = (page) => { const rows = all250.slice((page - 1) * 100, page * 100); return { success: true, products: { data: rows, links: [{ label: "Previous", url: null }, { label: "Next", url: page < 3 ? "x" : null }] } }; };
ok("paginated answer: all 250 products fetched across 3 pages", (await listAll({}, { lang: "en" })).length === 250 && S.productCalls === 3, `${S.productCalls} calls`);
fresh();
S.productsBody = (page) => ({ success: true, products: all250.slice((page - 1) * 100, page * 100) }); // plain arrays, no meta
ok("plain array that fills the page keeps asking for the next one", (await listAll({}, { lang: "en" })).length === 250 && S.productCalls === 3, `${S.productCalls} calls`);
fresh();
S.productsBody = () => ({ success: true, products: all250.slice(0, 100) }); // API ignores "page" and repeats itself
ok("an API that ignores 'page' does not loop forever", (await listAll({}, { lang: "en" })).length === 100 && S.productCalls === 2, `${S.productCalls} calls`);
fresh();

// ---- price + discount + tags
const NOW = Date.UTC(2026, 9, 20);
const disc = mapProduct(base(9, "Linen Shirt", "LS-1", "L", 1000, 900, "Men's Clothing", 1, "Piece", 4, { has_discount: true, discount_type: "percentage", discount_value: "10" }), "en", 0, NOW);
ok("percentage discount lowers the selling price, shop price becomes the 'was' price", disc.price === 810 && disc.mrp === 1000 && disc.discount === 19 && disc.tags.includes("sale") && disc.category === "shirts", JSON.stringify([disc.price, disc.mrp, disc.discount, disc.category]));
const flat = mapProduct(base(9, "Linen Shirt", "LS-1", "L", 1000, 900, "Men's Clothing", 1, "Piece", 4, { has_discount: true, discount_type: "flat", discount_value: "150" }), "en", 0, NOW);
ok("flat discount", flat.price === 750);
ok("'new' tag within 30 days of creation (DD-MM-YYYY date), not after", disc.tags.includes("new") && !mapProduct(base(9, "A", "A", "M", 10, 10, "X", 1, "Piece", 1, { created_at: "01-01-2026" }), "en", 0, NOW).tags.includes("new"));
const noDisc = mapProduct(base(10, "Plain Tee", "T", "M", 500, 500, "Men's Clothing", 1, "Piece", 2), "en", 0, NOW);
ok("mrp equal to price -> no sale, mrp null", noDisc.mrp === null && !noDisc.tags.includes("sale"));

// ---- photos
const photo = mapProduct(base(11, "Photo Tee", "P", "M", 500, 450, "Men's Clothing", 1, "Piece", 2, { cover_image_url: "https://app.dokani.cloud/storage/p/a.jpg", feature_image_urls: ["https://app.dokani.cloud/storage/p/b.jpg"] }), "en", 0, NOW);
ok("cover + feature photos become image / images / hoverImage", photo.image.endsWith("a.jpg") && photo.images.length === 2 && photo.hoverImage.endsWith("b.jpg") && photo.hasPhoto);

// ---- variants (shape still to be confirmed with a real sample: read leniently)
const varP = mapProduct(base(12, "Cotton Tee", "CT", "M", 700, 650, "Men's Clothing", 1, "Piece", 0, {
  is_size: true, is_colour: true, variant_status: 1, sizes: ["S", { name: "m" }, { size: "XL" }], colours: [{ name: "Navy", hex: "#001f3f" }, "Black"],
  variants: [{ stock_amount: "3.0000" }, { stock_amount: 2 }],
}), "en", 0, NOW);
ok("variant sizes read from strings and objects, normalised", JSON.stringify(varP.sizes) === '["S","M","XL"]', JSON.stringify(varP.sizes));
ok("variant colours (+ hex, colour family for the filter)", varP.colors.length === 2 && varP.colors[0].hex === "#001f3f" && varP.colors[0].family === "blue" && varP.colors[1].family === "black" && varP.colors[1].hex === "#999999");
ok("variant stock is the sum of the variants", varP.stock === 5, String(varP.stock));

// ---- helpers
ok("size normaliser", [["Free", "ONE"], ["", "ONE"], ["xl", "XL"], ["2XL", "XXL"], ["32", "32"], ["8y", "8Y"], ["M ", "M"], ["One Size", "ONE"]].every(([a, b]) => normSize(a) === b));
ok("category by name beats category label", guessCategory({ name: "Denim Jacket", category: { name: "Pants" } }) === "jackets" && guessCategory({ name: "Mystery", category: { name: "Pants" } }) === "jeans" && guessCategory({ name: "Mystery", category: { name: "Zzz" } }) === "accessories");

// ---- get / related / categories / health
fresh();
ok("get by id (string or number) and unknown id", (await get("3", { lang: "en" })).name === "Casual Zipper Hoodie" && (await get(99, { lang: "en" })) === null);
const rel = await related(1, { limit: 4, lang: "en" }); ok("related excludes the product itself", rel.length > 0 && rel.every((p) => p.id !== 1));
const cats = await categories(); ok("categories with the shop id they belong to", cats.length === 5 && cats[0].shopId === 552 && cats[0].name === "Men's Clothing");
const h = await health();
ok("health report", h.ok && h.products.shown === 6 && h.products.withStock === 1 && h.products.withPhoto === 0 && h.shopIdSeenInData === 552 && h.problems.some((x) => /photo/.test(x)) && !JSON.stringify(h).includes("secret-pass") && !JSON.stringify(h).includes("tok"), JSON.stringify(h).slice(0, 300));

// ---- the mock cart / orders work with Dokani products once registered
const { api, registerCatalog } = await import("@/services/index.js");
const dk = await listAll({}, { lang: "en" });
registerCatalog(dk);
await api.auth.register({ name: "Dokani Tester", email: "dk@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true });
const c1 = await api.cart.add({ productId: 1, size: "M", color: "", qty: 1 });
ok("cart prices the Dokani product (800), with its real name", c1.items[0].unitPrice === 800 && c1.items[0].name === "Premium Cotton Polo T-Shirt" && c1.subtotal === 800, JSON.stringify(c1.items[0]));
await rejects("a product with no stock cannot be added", () => api.cart.add({ productId: 2, size: "32", color: "", qty: 1 }), (e) => /out of stock/i.test(e.message));
await rejects("only 1 in stock: quantity 2 is refused", () => api.cart.add({ productId: 1, size: "M", color: "", qty: 1 }), (e) => /Maximum 1/.test(e.message));
ok("sample past orders use Dokani products", (await api.orders.list()).length === 2);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
