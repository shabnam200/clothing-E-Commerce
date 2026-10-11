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

// ---- reviews: write (only after receiving the product) + "helpful" votes
await api.auth.logout();
let rp = await api.catalog.reviews(1, { lang: "en" });
ok("guest sees reviews + summary", rp.items.length === 3 && rp.summary.count === 128 && rp.summary.average === 4.7, JSON.stringify(rp.summary));
ok("guest cannot review (block=login)", rp.canReview === false && rp.block === "login");
ok("default sort = most helpful", rp.items[0].helpful === 12 && rp.items[0].mine === false && rp.items[0].verified === true);
await rejects("review needs login", () => api.reviews.create(1, { rating: 5, text: "Lovely shirt, fits well." }), (e) => e.status === 401);
await rejects("vote needs login", () => api.reviews.vote("demo-1-0", { helpful: true }), (e) => e.status === 401);
await api.auth.register({ name: "Karim Hasan", email: "karim@x.com", password: "12345678", passwordConfirmation: "12345678", terms: true }); // gets delivered sample orders of products 1, 2 and 4
rp = await api.catalog.reviews(1, { lang: "en" }); ok("bought + delivered -> can review", rp.canReview === true && rp.block === null);
rp = await api.catalog.reviews(7, { lang: "en" }); ok("never bought -> not_purchased", rp.canReview === false && rp.block === "not_purchased");
await rejects("review without buying -> 403", () => api.reviews.create(7, { rating: 5, text: "I never bought this one." }), (e) => e.status === 403 && e.errors.review);
await rejects("review validation", () => api.reviews.create(1, { rating: 0, text: "short" }), (e) => e.status === 422 && e.errors.rating && e.errors.text);
await rejects("review bad product", () => api.reviews.create(99999, { rating: 5, text: "Lovely shirt, fits well." }), (e) => e.status === 404);
const mine = await api.reviews.create(1, { rating: 5, title: "Great shirt", text: "Soft fabric, true to size, quick delivery." });
ok("review created", mine.mine === true && mine.verified === true && mine.name === "Karim H." && mine.helpful === 0 && mine.title === "Great shirt", JSON.stringify(mine));
await rejects("one review per product", () => api.reviews.create(1, { rating: 4, text: "Trying to review a second time." }), (e) => e.status === 422 && e.errors.review);
rp = await api.catalog.reviews(1, { lang: "en", sort: "newest" });
ok("summary updated + already_reviewed", rp.summary.count === 129 && rp.canReview === false && rp.block === "already_reviewed" && rp.items.length === 4 && rp.items[0].id === mine.id && rp.items[0].mine === true);
ok("sort highest / lowest", (await api.catalog.reviews(1, { lang: "en", sort: "lowest" })).items[0].rating === 4 && (await api.catalog.reviews(1, { lang: "en", sort: "highest" })).items[0].rating === 5);
const pg = await api.catalog.reviews(1, { lang: "en", limit: 2, page: 2 }); ok("pagination", pg.items.length === 2 && pg.meta.last_page === 2 && pg.meta.total === 4);
await rejects("cannot vote on own review", () => api.reviews.vote(mine.id, { helpful: true }), (e) => e.status === 403);
let v = await api.reviews.vote("demo-1-1", { helpful: true }); ok("vote on a demo review", v.voted === true && v.helpful === 6, JSON.stringify(v));
v = await api.reviews.vote("demo-1-1", { helpful: true }); ok("vote is idempotent", v.voted === true && v.helpful === 6);
ok("voted flag comes back on the list", (await api.catalog.reviews(1, { lang: "en" })).items.find((r) => r.id === "demo-1-1").voted === true);
v = await api.reviews.vote("demo-1-1", { helpful: false }); ok("vote removed", v.voted === false && v.helpful === 5);
await rejects("vote on unknown review", () => api.reviews.vote(424242, { helpful: true }), (e) => e.status === 404);
await api.auth.logout(); await api.auth.login({ email: "sara@x.com", password: "12345678" });
v = await api.reviews.vote(mine.id, { helpful: true }); ok("another customer votes on Karim's review", v.voted === true && v.helpful === 1);
ok("Sara sees it as not hers + voted", (await api.catalog.reviews(1, { lang: "en", sort: "newest" })).items[0].mine === false);
await rejects("cannot delete someone else's review", () => api.reviews.remove(mine.id), (e) => e.status === 403);
await api.auth.logout(); await api.auth.login({ email: "karim@x.com", password: "12345678" });
ok("Karim sees the vote count", (await api.catalog.reviews(1, { lang: "en", sort: "newest" })).items[0].helpful === 1);
await api.reviews.remove(mine.id);
rp = await api.catalog.reviews(1, { lang: "en" }); ok("deleted -> summary back, can review again", rp.summary.count === 128 && rp.items.length === 3 && rp.canReview === true);
const bnRp = await api.catalog.reviews(1, { lang: "bn" }); ok("demo reviews follow the language", bnRp.items.some((r) => /[\u0980-\u09FF]/.test(r.text)));

// ---- support / newsletter / settings / campaigns
await rejects("support invalid", () => api.support.send({ name: "S", contact: "x", topic: "zzz", message: "short" }), (e) => e.errors.name && e.errors.contact && e.errors.topic && e.errors.message);
const sup = await api.support.send({ name: "Sara", contact: "sara@x.com", order: "#AVN-9023", topic: "order_status", message: "Where is my order please?" }); ok("support ref", /^SUP-\d{5}$/.test(sup.reference));
await api.newsletter.subscribe("a@b.com"); await api.newsletter.subscribe("a@b.com"); await rejects("newsletter invalid", () => api.newsletter.subscribe("nope"), (e) => e.errors.email);
const st = await api.settings.get(); ok("settings", st.freeDeliveryOver === 3000 && st.expressFee === 250 && st.paymentAccounts.bank.accNo && st.districts.includes("Sylhet") && st.support.phoneLabel, JSON.stringify(st).slice(0, 200));
ok("campaigns list is array", Array.isArray(await api.campaigns.list()));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
