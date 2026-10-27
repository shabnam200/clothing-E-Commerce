// Shopper accounts on Dokani Cloud: browser client (api.auth / api.user)  ->  /api/shopper proxy  ->  a fake Laravel that follows ShopperAuthController.
// Run:  node --import ./src/services/tests/register.mjs src/services/tests/shopper.test.mjs
process.env.NEXT_PUBLIC_MOCK_LATENCY = "0";
delete process.env.NEXT_PUBLIC_API_URL;
process.env.NEXT_PUBLIC_DOKANI_AUTH = "1";
Object.assign(process.env, { DOKANI_BASE_URL: "https://app.dokani.cloud/api", DOKANI_LOGIN: "shop@it-lab.test", DOKANI_PASSWORD: "secret-pass", DOKANI_SHOP_ID: "552" });

const { api, registerCatalog, tokenStore, ApiError, DOKANI_AUTH } = await import("@/services/index.js");
const { resetSession } = await import("@/services/dokani/client.js");
const route = await import("@/app/api/shopper/[...path]/route.js");

let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : (fail++, console.log("FAIL:", n, x)); };
const rejects = async (n, fn, check) => { try { await fn(); ok(n, false, "did not throw"); } catch (e) { ok(n, !check || check(e), `${e.name}: ${e.message}`); } };

// ---- fake Laravel (same rules and messages as ShopperAuthController / ApiTokenMiddleware / ShopperTokenMiddleware)
const L = { shoppers: [], tokens: new Map(), nextId: 1, nextTok: 1, staffLogins: 0, staffToken: "staff1", staffExpired: false, down: false, seen: [], fails: {} };
const reset = () => { Object.assign(L, { shoppers: [], tokens: new Map(), nextId: 1, nextTok: 1, staffLogins: 0, staffToken: "staff1", staffExpired: false, down: false, seen: [], fails: {} }); resetSession(); };
const cleanPhone = (v) => { v = String(v ?? "").replace(/[\s-]/g, ""); return v === "" ? null : v.replace(/^\+?88/, ""); };
const cleanEmail = (v) => { v = String(v ?? "").trim().toLowerCase(); return v === "" ? null : v; };
const pub = (s) => ({ id: s.id, name: s.name, email: s.email || "", phone: s.phone || "", avatar: null, birth_date: s.birth_date || null, preferences: s.preferences || {}, phone_verified: false });
const R = (status, data) => ({ ok: status < 400, status, json: async () => data });
const bad = (message, status, errors) => R(status, errors ? { message, errors } : { message });

function laravel(method, path, body, bearer) {
  L.seen.push({ method, path, body, bearer });
  if (path === "/login/" || path === "/login") { L.staffLogins++; L.staffToken = `staff${L.staffLogins}`; return R(200, { status: true, token: L.staffToken }); }
  const isShopper = ["/auth/me", "/auth/profile", "/auth/password", "/auth/logout"].includes(path);
  if (!isShopper) { // api.token middleware: staff token only
    if (!bearer) return R(401, { status: false, message: "Token missing" });
    if (L.staffExpired && bearer !== L.staffToken) return R(401, { message: "Unauthenticated." });
    if (bearer.startsWith("shp_")) return R(403, { status: false, message: "This token cannot be used here" });
  }
  if (path === "/auth/register") {
    const email = cleanEmail(body.email), phone = cleanPhone(body.phone);
    if (!email && !phone) return bad("Enter an email address or a mobile number.", 422);
    if (!String(body.name ?? "").trim()) return bad("Please enter your name.", 422, { name: ["Please enter your name."] });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Enter a valid email address, e.g. name@example.com.", 422, { email: ["Enter a valid email address, e.g. name@example.com."] });
    if (String(body.password ?? "").length < 6) return bad("Password must be at least 6 characters.", 422, { password: ["Password must be at least 6 characters."] });
    if (body.source !== undefined && !["avenor", "freshly"].includes(body.source)) return bad("bad source", 422);
    if (email && L.shoppers.some((s) => s.email === email)) return bad("An account with this email already exists. Please log in.", 409);
    const s = { id: L.nextId++, name: body.name.trim(), email, phone, password: body.password, status: 1 };
    L.shoppers.push(s);
    const t = `shp_${L.nextTok++}`; L.tokens.set(t, { shopper: s, revoked: false });
    return R(201, { token: t, user: pub(s) });
  }
  if (path === "/auth/login") {
    const raw = String(body.login ?? body.identifier ?? body.email ?? body.phone ?? "").trim();
    if (!raw || !body.password) return bad("Enter your email or mobile number and your password.", 422);
    const key = raw.toLowerCase();
    if ((L.fails[key] || 0) >= 5) return bad("Too many wrong attempts. Please try again in 10 minutes.", 429);
    const s = L.shoppers.find((x) => (raw.includes("@") ? x.email === cleanEmail(raw) : x.phone === cleanPhone(raw)));
    if (!s || s.password !== body.password) { L.fails[key] = (L.fails[key] || 0) + 1; return bad("Wrong email / mobile number or password.", 401); }
    L.fails[key] = 0;
    const t = `shp_${L.nextTok++}`; L.tokens.set(t, { shopper: s, revoked: false });
    return R(200, { token: t, user: pub(s) });
  }
  // shopper.token middleware
  const tk = bearer && L.tokens.get(bearer);
  if (!bearer) return bad("Please log in to continue.", 401);
  if (!tk || tk.revoked) return bad("Your session has expired. Please log in again.", 401);
  const s = tk.shopper;
  if (path === "/auth/me") return R(200, pub(s));
  if (path === "/auth/profile") {
    const phone = "phone" in body ? cleanPhone(body.phone) : s.phone, email = "email" in body ? cleanEmail(body.email) : s.email;
    if (phone && !/^01[3-9]\d{8}$/.test(phone)) return bad("Enter a valid mobile number, e.g. 01712345678.", 422, { phone: ["Enter a valid mobile number, e.g. 01712345678."] });
    if (email && L.shoppers.some((x) => x.id !== s.id && x.email === email)) return bad("Another account already uses this email.", 409);
    if ("name" in body) s.name = String(body.name).trim();
    s.email = email; s.phone = phone;
    return R(200, pub(s));
  }
  if (path === "/auth/password") {
    if (!body.current) return bad("Please enter your current password.", 422, { current: ["Please enter your current password."] });
    if (String(body.next ?? "").length < 6) return bad("New password must be at least 6 characters.", 422, { next: ["New password must be at least 6 characters."] });
    if (s.password !== body.current) return bad("Your current password is wrong.", 422);
    s.password = body.next;
    for (const [t, v] of L.tokens) if (v.shopper === s && t !== bearer) v.revoked = true;
    return R(204, null);
  }
  if (path === "/auth/logout") { tk.revoked = true; return R(204, null); }
  return bad("no route", 404);
}

// one fetch for everything: our own /api/shopper/* goes through the REAL route.js, https://app.dokani.cloud/api/* hits the fake Laravel
const routeFor = { GET: route.GET, POST: route.POST, PUT: route.PUT };
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url, "http://localhost:3000"), method = (init.method || "GET").toUpperCase();
  if (u.origin === "http://localhost:3000") {
    const h = routeFor[method]; if (!h) return R(405, { message: "no" });
    const res = await h(new Request(u, { method, headers: init.headers, body: init.body }));
    return { ok: res.ok, status: res.status, json: async () => { const t = await res.text(); return t ? JSON.parse(t) : null; } };
  }
  if (L.down) throw new Error("ECONNREFUSED");
  const path = u.pathname.replace("/api", "");
  const bearer = String(init.headers?.Authorization || "").replace(/^Bearer /, "") || null;
  let body = init.body;
  if (typeof body === "string") body = JSON.parse(body); else if (body instanceof FormData) body = Object.fromEntries(body);
  return laravel(method, path, body ?? {}, bearer);
};
const raw = async (method, p, body, headers = {}) => { const res = await fetch(`/api/shopper/${p}`, { method, headers: { "Content-Type": "application/json", ...headers }, body: body === undefined ? undefined : JSON.stringify(body) }); return { status: res.status, data: await res.json() }; };

ok("DOKANI_AUTH switch is on", DOKANI_AUTH === true);

// ================= the proxy (server) =================
reset();
ok("unknown action -> 404", (await raw("POST", "nope", {})).status === 404);
ok("wrong method -> 404 (GET register)", (await raw("GET", "register")).status === 404);
ok("nothing reached Laravel for those", L.seen.length === 0);

{
  const r = await raw("POST", "register", { name: "Amina Begum", email: "Amina@Example.com", password: "secret1", shop_id: 999, token_payload: { shop_id: 999 }, source: "hacker", role_id: 1 });
  ok("register -> 201 with token + user", r.status === 201 && /^shp_/.test(r.data.token) && r.data.user.name === "Amina Begum", JSON.stringify(r));
  const sent = L.seen.find((x) => x.path === "/auth/register");
  ok("register used the shop's service token", sent.bearer === "staff1", sent.bearer);
  ok("only allowed keys were forwarded, source forced to avenor", !("shop_id" in sent.body) && !("token_payload" in sent.body) && !("role_id" in sent.body) && sent.body.source === "avenor", JSON.stringify(sent.body));
  ok("service login happened once", L.staffLogins === 1);
}
{
  const r = await raw("POST", "register", { name: "Amina Two", email: "amina@example.com", password: "secret1" });
  ok("duplicate email -> 409 with Laravel's message", r.status === 409 && /already exists/.test(r.data.message), JSON.stringify(r));
  const v = await raw("POST", "register", { name: "", email: "x@y.com", password: "secret1" });
  ok("validation -> 422 keeps errors{field}", v.status === 422 && v.data.errors?.name, JSON.stringify(v));
  ok("non-JSON body -> 422 and Laravel not called", (await fetch("/api/shopper/register", { method: "POST", body: "oops" }).then((x) => x.status)) === 422);
}
{
  const before = L.seen.length;
  L.staffExpired = true; L.staffToken = "rotated-by-server"; // the service token the proxy holds is now dead: it logs in again and retries once
  const r = await raw("POST", "register", { name: "Rahim", email: "rahim@example.com", password: "secret1" });
  ok("expired service token -> automatic re-login + retry", r.status === 201 && L.staffLogins === 2, JSON.stringify(r));
  L.staffExpired = false;
  ok("more than one Laravel call happened", L.seen.length - before >= 3);
}
{
  const l = await raw("POST", "login", { login: "amina@example.com", password: "secret1" });
  ok("login -> 200 token", l.status === 200 && /^shp_/.test(l.data.token));
  const w = await raw("POST", "login", { login: "amina@example.com", password: "wrong" });
  ok("wrong password -> 401 with message", w.status === 401 && /Wrong email/.test(w.data.message));
  const me = await raw("GET", "me", undefined, { Authorization: `Bearer ${l.data.token}` });
  ok("me with the shopper token -> user (token passed through, no service token)", me.status === 200 && me.data.email === "amina@example.com" && L.seen.at(-1).bearer === l.data.token);
  ok("me without a token -> 401 and Laravel not called", (await (async () => { const n = L.seen.length; const r = await raw("GET", "me"); return r.status === 401 && L.seen.length === n; })()));
  const staffOnMe = await raw("GET", "me", undefined, { Authorization: "Bearer staff1" });
  ok("a staff token is refused on /me", staffOnMe.status === 401);
}
{
  L.down = true;
  const r = await raw("POST", "login", { login: "amina@example.com", password: "secret1" });
  ok("Laravel unreachable -> 502 with a plain message (no address / error text)", r.status === 502 && !/ECONNREFUSED|dokani/i.test(r.data.message), JSON.stringify(r));
  L.down = false;
}
{
  const keep = { ...process.env }; delete process.env.DOKANI_PASSWORD;
  const r = await raw("POST", "login", { login: "a@b.co", password: "x" });
  ok("Dokani not configured -> 503", r.status === 503, JSON.stringify(r));
  process.env.DOKANI_PASSWORD = keep.DOKANI_PASSWORD;
}

// ================= the browser client (api.*) =================
reset(); tokenStore.clear(); sessionStorage.removeItem("avenor:mock:db:v1");
registerCatalog([{ id: 777, name: "Test Polo", image: "", price: 500, mrp: null, stock: 5, sizes: ["M"], colors: [] }]);

const reg = await api.auth.register({ name: "Nusrat Jahan", email: "Nusrat@Example.com", password: "password1", passwordConfirmation: "password1", terms: true });
ok("register: token stored", tokenStore.get() === reg.token && /^shp_/.test(reg.token));
ok("register: user mapped (name, lower-cased email, tier from the mock)", reg.user.name === "Nusrat Jahan" && reg.user.email === "nusrat@example.com" && reg.user.tier === "Member", JSON.stringify(reg.user));
ok("the browser never sent the service token (server did)", !JSON.stringify(L.seen.filter((x) => x.path === "/auth/register")).includes("shp_"));

await rejects("register: duplicate email -> error under the email field", () => api.auth.register({ name: "Other", email: "nusrat@example.com", password: "password1" }),
  (e) => e instanceof ApiError && e.status === 409 && /already exists/.test(e.field("email") || ""));
await rejects("register: 422 from Laravel keeps its field", () => api.auth.register({ name: "Z", email: "not-an-email", password: "password1" }),
  (e) => e.status === 422 && Boolean(e.field("email")));

// cart / wishlist are still the mock: they must work with the REAL token
await api.auth.logout();
ok("logout: token cleared and the real token is revoked on Laravel", tokenStore.get() === null && [...L.tokens.values()].some((t) => t.revoked));
const lg = await api.auth.login({ email: "nusrat@example.com", password: "password1" });
ok("login: new token, same person", lg.token !== reg.token && lg.user.name === "Nusrat Jahan");
const cart = await api.cart.add({ productId: 777, size: "M", color: "", qty: 2 });
ok("mock cart works behind a real login", cart.items.length === 1 && cart.items[0].qty === 2 && cart.count === 2, JSON.stringify(cart));
await api.wishlist.add(777);
ok("mock wishlist works too", (await api.wishlist.get()).ids.includes(777));

sessionStorage.removeItem("avenor:mock:db:v1"); // simulate cleared tab data
const me = await api.auth.me();
ok("me: user from Laravel", me.email === "nusrat@example.com" && me.id === lg.user.id);
ok("me: the mock session is rebuilt (cart usable again, empty)", (await api.cart.get()).count === 0);

await rejects("login: wrong password -> error under the email field", () => api.auth.login({ email: "nusrat@example.com", password: "nope" }), (e) => e.status === 401 && /Wrong email/.test(e.field("email") || ""));
ok("a failed login keeps the current session", tokenStore.get() === lg.token);

const up = await api.user.updateProfile({ name: "Nusrat J.", email: "nusrat@example.com", phone: "+8801712345678" });
ok("updateProfile: saved on Laravel (phone cleaned to 01...)", up.name === "Nusrat J." && up.phone === "01712345678" && L.shoppers[0].phone === "01712345678", JSON.stringify(up));
ok("profile() reads it back", (await api.user.profile()).phone === "01712345678");
await rejects("updateProfile: bad phone -> 422 under the phone field", () => api.user.updateProfile({ name: "N", email: "nusrat@example.com", phone: "12345" }), (e) => e.status === 422 && Boolean(e.field("phone")));

const other = await api.auth.login({ email: "nusrat@example.com", password: "password1" }); // a second device
tokenStore.set(lg.token);
await rejects("changePassword: wrong current -> 422", () => api.auth.changePassword({ current: "bad", next: "newpass99" }), (e) => e.status === 422 && /current password is wrong/.test(e.message));
await rejects("changePassword: too short -> 422 under next", () => api.auth.changePassword({ current: "password1", next: "abc" }), (e) => e.status === 422 && Boolean(e.field("next")));
await api.auth.changePassword({ current: "password1", next: "newpass99" });
ok("changePassword: this device stays logged in", (await api.auth.me()).email === "nusrat@example.com");
tokenStore.set(other.token);
await rejects("changePassword: the other device is logged out (401)", () => api.auth.me(), (e) => e.status === 401);
ok("a dead token clears the session", tokenStore.get() === null);
await rejects("old password no longer works", () => api.auth.login({ email: "nusrat@example.com", password: "password1" }), (e) => e.status === 401);
ok("new password works", (await api.auth.login({ email: "nusrat@example.com", password: "newpass99" })).user.name === "Nusrat J.");

// brute force guard of Laravel (429) is shown as a plain message
for (let i = 0; i < 5; i++) await api.auth.login({ email: "nusrat@example.com", password: "x" }).catch(() => {});
await rejects("5 wrong attempts -> 429 message", () => api.auth.login({ email: "nusrat@example.com", password: "x" }), (e) => e.status === 429 && /Too many/.test(e.message));

// a Laravel outage on the way: the UI gets an ApiError, not a crash
L.down = true;
await rejects("Laravel down -> ApiError 502", () => api.auth.login({ email: "nusrat@example.com", password: "newpass99" }), (e) => e instanceof ApiError && e.status === 502);
L.down = false;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
