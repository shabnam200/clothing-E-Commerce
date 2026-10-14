// MOCK server tests. Run:  node --import ./src/services/tests/register.mjs src/services/tests/mock.test.mjs
process.env.NEXT_PUBLIC_MOCK_LATENCY = "0";
delete process.env.NEXT_PUBLIC_API_URL;
const { api } = await import("@/services/index.js");
const { ApiError } = await import("@/services/errors.js");
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; } else { fail++; console.log("FAIL:", name, extra); } };
const rejects = async (name, fn, check) => { try { await fn(); ok(name, false, "did not throw"); } catch (e) { ok(name, e instanceof ApiError && (!check || check(e)), `${e.status} ${e.message} ${JSON.stringify(e.errors)}`); } };

// ---- not logged in
await rejects("cart needs login", () => api.cart.get(), (e) => e.status === 401);

// ---- register validation
await rejects("register bad", () => api.auth.register({ name: "", email: "x", password: "123", passwordConfirmation: "1", terms: false }), (e) => e.status === 422 && e.errors.email && e.errors.password && e.errors.terms && e.errors.name);
await rejects("register bad referral", () => api.auth.register({ name: "Rahim", email: "r@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true, referral: "bad" }), (e) => e.reason === "invalid_format");
const reg = await api.auth.register({ name: "Rahim Uddin", email: "rahim@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true });
ok("register token", reg.token.startsWith("mock_") && reg.user.name === "Rahim Uddin" && reg.user.tier === "Member", JSON.stringify(reg.user));
await rejects("duplicate email", () => api.auth.register({ name: "Other", email: "RAHIM@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true }), (e) => e.errors.email);
const me = await api.auth.me(); ok("me", me.email === "rahim@x.com");

// ---- referral code of rahim, second user uses it
const myRef = await api.referrals.me(); ok("referral code format", /^AVN-[2-9A-HJKMNP-Z]{5}$/.test(myRef.code), myRef.code);
await api.auth.logout();
await rejects("me after logout", () => api.auth.me(), (e) => e.status === 401);
await rejects("bad login", () => api.auth.login({ email: "rahim@x.com", password: "nope" }), (e) => e.status === 422);
const sara = await api.auth.register({ name: "Sara", email: "sara@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true, referral: myRef.code });
let sRef = await api.referrals.me();
ok("sara referredBy + pending ledger", sRef.referredBy === myRef.code && sRef.ledger[0].status === "pending" && sRef.ledger[0].amount === 200, JSON.stringify(sRef));
await rejects("apply twice", () => api.referrals.apply("AVN-ABCDE"), (e) => e.reason === "already_used");
await rejects("apply own", () => api.referrals.apply(sRef.code), (e) => e.reason === "own_code" || e.reason === "already_used");

// ---- catalog (public, via adapters)
const cat = await api.catalog.list({}, { lang: "en" });
ok("catalog list", cat.items.length > 5 && cat.items[0].priceText.startsWith("৳"));
const p1 = cat.items.find((p) => p.sizes.length && p.stock > 0);
const prodById = await api.catalog.get(p1.id, { lang: "en" }); ok("catalog get", prodById?.id === p1.id);
ok("catalog get 404 -> null/undefined", !(await api.catalog.get(99999, { lang: "en" })));
const rel = await api.catalog.related(p1.id, { limit: 4, lang: "en" }); ok("related", rel.length === 4 && rel.every((r) => r.id !== p1.id));

// ---- cart
const color = p1.colors[0]?.name ?? "";
let cart = await api.cart.add({ productId: p1.id, size: p1.sizes[0], color, qty: 2 });
ok("cart add", cart.count === 2 && cart.items[0].unitPrice === p1.price && cart.subtotal === p1.price * 2, JSON.stringify(cart));
cart = await api.cart.add({ productId: p1.id, size: p1.sizes[0], color, qty: 1 }); ok("cart merges same line", cart.items.length === 1 && cart.items[0].qty === 3);
await rejects("cart over max", () => api.cart.add({ productId: p1.id, size: p1.sizes[0], color, qty: 50 }), (e) => e.status === 422 && /Maximum/.test(e.message));
await rejects("cart bad size", () => api.cart.add({ productId: p1.id, size: "ZZ", color, qty: 1 }), (e) => e.errors.size);
cart = await api.cart.setQty(cart.items[0].itemId, 1); ok("setQty", cart.items[0].qty === 1 && cart.total === cart.subtotal + cart.delivery);
await rejects("setQty 0", () => api.cart.setQty(cart.items[0].itemId, 0), (e) => e.errors.qty);
const express = await api.cart.get({ shipping: "express" }); ok("express fee", express.delivery === 250 && express.total === express.subtotal + 250, JSON.stringify(express));
const other = cat.items.filter((p) => p.id !== p1.id && p.stock > 0 && p.sizes.length).slice(0, 2);
cart = await api.cart.addOutfit(other.map((p) => ({ productId: p.id, size: p.sizes[0], color: p.colors[0]?.name ?? "" }))); ok("outfit", cart.items.length === 3);
await rejects("outfit all-or-nothing", () => api.cart.addOutfit([{ productId: other[0].id, size: other[0].sizes[0], color: other[0].colors[0]?.name ?? "" }, { productId: 99999, size: "S", color: "" }]), (e) => e.status === 422);
cart = await api.cart.get(); ok("outfit rolled back", cart.items.length === 3 && cart.items.find((i) => i.productId === other[0].id).qty === 1);
cart = await api.cart.remove(cart.items[2].itemId); ok("remove", cart.items.length === 2);

// ---- wishlist + alerts
await api.wishlist.add(p1.id); await api.wishlist.add(p1.id);
ok("wishlist idempotent", (await api.wishlist.get()).ids.length === 1);
await rejects("alert prefs needs channel", () => api.priceAlerts.savePrefs({ sms: false, email: false, phone: "", emailAddr: "" }), (e) => e.status === 422);
await rejects("alert prefs bad phone", () => api.priceAlerts.savePrefs({ sms: true, email: false, phone: "123", emailAddr: "" }), (e) => e.errors.phone);
await api.priceAlerts.savePrefs({ sms: true, email: true, phone: "01712-345678", emailAddr: "s@x.com" });
await api.priceAlerts.enable(p1.id, p1.price);
let al = await api.priceAlerts.get(); ok("alerts", al.prefs.phone === "01712345678" && al.items[String(p1.id)].basePrice === p1.price, JSON.stringify(al));
await api.priceAlerts.enable(p1.id, p1.price - 100); al = await api.priceAlerts.get(); ok("alert reset baseline", al.items[String(p1.id)].basePrice === p1.price - 100);
await api.wishlist.remove(p1.id); al = await api.priceAlerts.get(); ok("wishlist remove cascades alert", Object.keys(al.items).length === 0);

// ---- size passport
await rejects("passport empty", () => api.user.sizePassport.save({ height: "170", weight: "", chest: "", waist: "", age: "" }), (e) => e.errors.chest);
await rejects("passport range", () => api.user.sizePassport.save({ chest: "500" }), (e) => e.errors.chest);
let sp = await api.user.sizePassport.save({ height: "", weight: "", chest: "", waist: "", age: "7" }); ok("passport age only", sp.age === 7 || sp.age === "7", JSON.stringify(sp));
sp = await api.user.sizePassport.get(); ok("passport get", String(sp.age) === "7");
await api.user.sizePassport.clear(); sp = await api.user.sizePassport.get(); ok("passport clear", sp.age === "" && sp.chest === "");

// ---- profile + addresses
await rejects("profile needs phone", () => api.user.updateProfile({ name: "Sara A", email: "sara@x.com", phone: "" }), (e) => e.errors.phone);
const pr = await api.user.updateProfile({ name: "Sara A", email: "sara@x.com", phone: "01712-345678" }); ok("profile", pr.name === "Sara A" && pr.phone === "01712345678");
let ad = await api.user.addresses.add({ type: "Home", address: "House 1, Road 2", city: "Dhaka", phone: "" }); ok("first address default", ad.length === 1 && ad[0].isDefault);
ad = await api.user.addresses.add({ type: "Office", address: "Level 4 Summit", city: "Dhaka", phone: "01712345678" }); ok("second not default", ad[1].isDefault === false);
ad = await api.user.addresses.setDefault(ad[1].id); ok("set default", ad[1].isDefault && !ad[0].isDefault);
ad = await api.user.addresses.remove(ad[1].id); ok("delete default reassigns", ad.length === 1 && ad[0].isDefault);
await rejects("address invalid", () => api.user.addresses.add({ type: "H", address: "x", city: "", phone: "" }), (e) => e.errors.type && e.errors.address && e.errors.city);

// ---- orders
const form = { name: "Sara A", phone: "01712-345678", email: "", district: "Dhaka", address: "House 1, Road 2, Dhanmondi", note: "", method: "cod", sender: "", trx: "" };
const items = cart.items.map((l) => ({ productId: l.productId, size: l.size, color: l.color, qty: l.qty }));
await rejects("order invalid", () => api.orders.place({ form: { ...form, name: "A", method: "bkash" }, items, shipping: "standard" }), (e) => e.errors.name && e.errors.sender_number && e.errors.trx_id);
await rejects("order empty", () => api.orders.place({ form, items: [], shipping: "standard" }), (e) => e.errors.items);
const o = await api.orders.place({ form, items, shipping: "express" });
ok("order placed", o.number.startsWith("AVN-") && o.status === "pending" && o.paymentStatus === "unpaid" && o.delivery === 250 && o.total === o.subtotal + 250, JSON.stringify(o));
ok("cart cleared after order", (await api.cart.get()).count === 0);
const o2 = await api.orders.place({ form: { ...form, method: "bkash", sender: "01712345678", trx: "ABC123XY" }, items, shipping: "standard" });
ok("offline payment pending verification", o2.paymentStatus === "pending_verification");
const orders = await api.orders.list(); ok("orders list (2 seeded + 2 new)", orders.length === 4, String(orders.length));
const delivered = orders.filter((x) => x.status === "delivered");
ok("seeded delivered orders", delivered.length === 2);
const open = delivered.find((x) => { const d = new Date(`${x.deliveredOn}T23:59:59`).getTime() + 7 * 864e5; return d > Date.now(); });
const closed = delivered.find((x) => x !== open);
await rejects("return not delivered", () => api.orders.requestReturn(o.id, { type: "return", reason: "x" }), (e) => /delivered/.test(e.message));
await rejects("return window closed", () => api.orders.requestReturn(closed.id, { type: "return", reason: "Damaged" }), (e) => /closed/.test(e.message));
await rejects("return needs reason", () => api.orders.requestReturn(open.id, { type: "return", reason: "" }), (e) => e.errors.reason);
const rr = await api.orders.requestReturn(open.id, { type: "exchange", reason: "Wrong size", note: "M please" }); ok("return ok", rr.type === "exchange" && rr.status === "requested");
await rejects("return twice", () => api.orders.requestReturn(open.id, { type: "return", reason: "x" }), (e) => /already/.test(e.message));
ok("return_request visible in list", (await api.orders.list()).find((x) => x.id === open.id).returnRequest.type === "exchange");

// ---- order tracking history + cancel
const got = await api.orders.get(o.id);
ok("orders.get returns items + history", got.id === o.id && got.items.length === items.length && got.items[0].name && got.history[0].status === "pending", JSON.stringify(got.history));
ok("order keeps receiver + payment details", got.receiver.name === "Sara A" && got.receiver.phone === "01712345678" && got.district === "Dhaka", JSON.stringify(got.receiver));
const got2 = await api.orders.get(o2.id);
ok("prepaid order keeps sender number + trx id", got2.senderNumber === "01712345678" && got2.trxId === "ABC123XY", JSON.stringify([got2.senderNumber, got2.trxId]));
ok("seeded order has receiver", (await api.orders.get(closed.id)).receiver.name === "Sara");
await rejects("orders.get unknown", () => api.orders.get(999999), (e) => e.status === 404);
await rejects("cancel needs reason", () => api.orders.cancel(o.id, { reason: "" }), (e) => e.errors.reason);
await rejects("cancel delivered", () => api.orders.cancel(closed.id, { reason: "x" }), (e) => /shipped|delivered|cancel/i.test(e.message));
const pointsBefore = (await api.user.profile()).points;
const c1 = await api.orders.cancel(o.id, { reason: "Ordered by mistake", note: "sorry" });
ok("cancel ok (cod)", c1.status === "cancelled" && c1.cancelReason === "Ordered by mistake" && c1.cancelledAt && c1.paymentStatus === "unpaid" && c1.history.at(-1).status === "cancelled", JSON.stringify(c1));
await rejects("cancel twice", () => api.orders.cancel(o.id, { reason: "x" }), (e) => /already cancelled/.test(e.message));
ok("cancelled order stays cancelled in list", (await api.orders.list()).find((x) => x.id === o.id).status === "cancelled");
ok("cancelled order no longer earns points", (await api.user.profile()).points <= pointsBefore);
const c2 = await api.orders.cancel(o2.id, { reason: "Other" });
ok("cancel prepaid -> refund pending", c2.paymentStatus === "refund_pending", c2.paymentStatus);
await rejects("return on cancelled order", () => api.orders.requestReturn(o.id, { type: "return", reason: "x" }), (e) => /delivered/.test(e.message));

// ---- referral first order credited (sara was referred by rahim)
sRef = await api.referrals.me(); ok("sara reward credited after first order", sRef.ledger.find((l) => l.kind === "invited").status === "credited");
const prof = await api.user.profile(); ok("points include referral + orders", prof.points >= 200, JSON.stringify(prof));
await api.auth.logout(); await api.auth.login({ email: "rahim@x.com", password: "12345678" });
const rr2 = await api.referrals.me(); ok("rahim invite credited + 200 ledger", rr2.invites[0]?.status === "credited" && rr2.ledger.some((l) => l.kind === "inviter" && l.status === "credited"), JSON.stringify(rr2));

// ---- support / newsletter / settings / campaigns
await rejects("support invalid", () => api.support.send({ name: "S", contact: "x", topic: "zzz", message: "short" }), (e) => e.errors.name && e.errors.contact && e.errors.topic && e.errors.message);
const sup = await api.support.send({ name: "Sara", contact: "sara@x.com", order: "#AVN-9023", topic: "order_status", message: "Where is my order please?" }); ok("support ref", /^SUP-\d{5}$/.test(sup.reference));
await api.newsletter.subscribe("a@b.com"); await api.newsletter.subscribe("a@b.com"); await rejects("newsletter invalid", () => api.newsletter.subscribe("nope"), (e) => e.errors.email);
const st = await api.settings.get(); ok("settings", st.freeDeliveryOver === 3000 && st.expressFee === 250 && st.paymentAccounts.bank.accNo && st.districts.includes("Sylhet") && st.support.phoneLabel, JSON.stringify(st).slice(0, 200));
ok("campaigns list is array", Array.isArray(await api.campaigns.list()));


// ---- NEW: coupons + reviews (fresh account, so earlier orders cannot interfere)
await api.auth.logout();
await api.auth.register({ name: "Coupon Tester", email: "tester@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true });
const pricey = [...cat.items].filter((p) => p.stock > 0 && p.sizes.length).sort((a, b) => b.price - a.price)[0];
const cheap = [...cat.items].filter((p) => p.stock > 0 && p.sizes.length && p.price < 900).sort((a, b) => a.price - b.price)[0];
const lineOf = (p, qty = 1) => ({ productId: p.id, size: p.sizes[0], color: p.colors[0]?.name ?? "", qty });
await api.cart.add({ ...lineOf(cheap, 1) });
await rejects("coupon min subtotal", () => api.coupons.validate({ code: "AVENOR10", shipping: "standard" }), (e) => e.reason === "min_subtotal" && e.field("coupon"));
await api.cart.clear();
const cc = await api.cart.add(lineOf(pricey, 2)); const sub = cc.subtotal;
await rejects("coupon invalid", () => api.coupons.validate({ code: "NOPE", shipping: "standard" }), (e) => e.reason === "invalid" && e.field("coupon"));
const c10 = await api.coupons.validate({ code: "avenor10", shipping: "standard" }); ok("percent coupon (case-insensitive, capped)", c10.code === "AVENOR10" && c10.type === "percent" && c10.discount === Math.min(500, Math.round(sub * 0.1)), JSON.stringify(c10));
if (sub >= 1500) { const w = await api.coupons.validate({ code: "WELCOME200", shipping: "standard" }); ok("flat coupon", w.discount === 200, JSON.stringify(w)); }
if (sub < 3000) { const fs = await api.coupons.validate({ code: "FREESHIP", shipping: "express" }); ok("free-delivery coupon waives the express fee", fs.discount === 250, JSON.stringify(fs)); }
const f2 = { name: "Coupon Tester", phone: "01812345678", email: "", district: "Dhaka", address: "House 9, Road 3, Banani", note: "", method: "cod", sender: "", trx: "", coupon: "AVENOR10" };
const it2 = [lineOf(pricey, 2)];
await rejects("order with a bad coupon", () => api.orders.place({ form: { ...f2, coupon: "BAD" }, items: it2, shipping: "standard" }), (e) => e.errors.coupon);
const od = await api.orders.place({ form: f2, items: it2, shipping: "standard" });
ok("order applies the coupon server-side", od.coupon === "AVENOR10" && od.discount === c10.discount && od.total === od.subtotal + od.delivery - od.discount, JSON.stringify(od));
ok("order detail keeps coupon + discount", (await api.orders.get(od.id)).discount === c10.discount);
await api.cart.add(lineOf(pricey, 2));
await rejects("coupon is single use", () => api.coupons.validate({ code: "AVENOR10", shipping: "standard" }), (e) => e.reason === "already_used");
await rejects("first-order-only code after an order", () => api.coupons.validate({ code: "WELCOME200", shipping: "standard" }), (e) => e.reason === "first_order_only");
await api.orders.cancel(od.id, { reason: "Ordered by mistake" });
ok("coupon usable again after the order is cancelled", (await api.coupons.validate({ code: "AVENOR10", shipping: "standard" })).discount > 0);

const rv = await api.catalog.reviews(pricey.id, { lang: "en" });
ok("seeded reviews with helpful counts", rv.items.length === 3 && rv.items[0].helpfulCount === 12 && rv.items[0].verified && !rv.items[0].helpful && rv.meta.total === 3, JSON.stringify(rv.items[0]));
await api.auth.logout();
await rejects("writing a review needs login", () => api.reviews.create(pricey.id, { rating: 5, text: "Great product indeed" }), (e) => e.status === 401);
ok("guests can read reviews", (await api.catalog.reviews(pricey.id, { lang: "en" })).items.length === 3);
await api.auth.login({ email: "tester@x.com", password: "12345678" });
await rejects("review validation", () => api.reviews.create(pricey.id, { rating: 9, text: "short" }), (e) => e.errors.rating && e.errors.text);
const nr = await api.reviews.create(pricey.id, { rating: 4, text: "Nice fabric and good stitching overall." });
ok("review created (not verified: the only order was cancelled)", nr.mine && nr.rating === 4 && nr.name === "Coupon T." && nr.verified === false && nr.helpfulCount === 0, JSON.stringify(nr));
await rejects("one review per product", () => api.reviews.create(pricey.id, { rating: 5, text: "Trying a second review here" }), (e) => /already reviewed/.test(e.message));
const rv2 = await api.catalog.reviews(pricey.id, { lang: "en" }); ok("new review is listed first", rv2.items.length === 4 && rv2.items[0].id === nr.id && rv2.items[0].mine);
const h1 = await api.reviews.setHelpful(rv2.items[1].id, true); ok("helpful +1", h1.helpful && h1.helpfulCount === 13, JSON.stringify(h1));
ok("helpful is idempotent", (await api.reviews.setHelpful(rv2.items[1].id, true)).helpfulCount === 13);
ok("helpful is remembered for me", (await api.catalog.reviews(pricey.id, { lang: "en" })).items[1].helpful === true);
const h3 = await api.reviews.setHelpful(rv2.items[1].id, false); ok("helpful undo", !h3.helpful && h3.helpfulCount === 12);
await rejects("cannot vote on your own review", () => api.reviews.setHelpful(nr.id, true), (e) => /own review/.test(e.message));
await rejects("helpful on an unknown review", () => api.reviews.setHelpful("zzz", true), (e) => e.status === 404);

// ---- login / sign-up with a mobile number or an email (one "identifier" field)
await api.auth.logout();
const ph = await api.auth.register({ name: "Karim Hasan", identifier: "+880 1998-765432", password: "12345678", passwordConfirmation: "12345678", terms: true });
ok("register with phone", ph.user.phone === "01998765432" && !ph.user.email, JSON.stringify(ph.user));
await rejects("duplicate phone (other format)", () => api.auth.register({ name: "Other", identifier: "01998 765432", password: "12345678", passwordConfirmation: "12345678", terms: true }), (e) => e.errors.email);
await rejects("bad identifier", () => api.auth.register({ name: "Other", identifier: "12345", password: "12345678", passwordConfirmation: "12345678", terms: true }), (e) => e.errors.email);
await api.auth.logout();
for (const id of ["01998765432", "+8801998765432", "০১৯৯৮-৭৬৫৪৩২"]) { const l = await api.auth.login({ identifier: id, password: "12345678" }); ok(`phone login ${id}`, l.user.name === "Karim Hasan"); await api.auth.logout(); }
await rejects("phone login wrong password", () => api.auth.login({ identifier: "01998765432", password: "nope" }), (e) => e.status === 422 && e.errors.email);
const em = await api.auth.login({ identifier: " RAHIM@x.com ", password: "12345678" }); ok("email login via identifier", em.user.email === "rahim@x.com"); await api.auth.logout();
const legacy = await api.auth.login({ email: "rahim@x.com", password: "12345678" }); ok("legacy {email} login still works", legacy.user.email === "rahim@x.com");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
