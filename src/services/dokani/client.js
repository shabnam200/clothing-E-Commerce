// Minimal Dokani Cloud HTTP client: login once, keep the token on the server, add it to every call, log in again when it dies.
import { TOKEN_TTL_MS, cfg } from "./config";

export class DokaniError extends Error {
  constructor(message, { status = 0, data = null } = {}) { super(message); this.name = "DokaniError"; this.status = status; this.data = data; }
}

const LOG = process.env.DOKANI_LOG === "1"; // DOKANI_LOG=1 in .env.local: print every Dokani call (and every cache hit) in the terminal
const log = (...a) => { if (LOG) console.log("[dokani]", ...a); };

// ---- shared read cache (server memory, survives hot reloads) -----------------------------------------------------------------
// dokaniGet(path, query, { ttl }) keeps the answer for `ttl` ms. After that it still answers instantly with the old copy and
// refreshes in the background (stale-while-revalidate), so a visitor almost never waits for Dokani. Errors are never cached.
// Only use `ttl` for PUBLIC shop data, never for anything that depends on a logged-in shopper.
const store = globalThis.__dokaniReadCache || (globalThis.__dokaniReadCache = new Map()); // key -> { at, value, pending }
const STALE_LIMIT_MS = 10 * 60 * 1000; // a copy older than this is not served any more
export function clearDokaniCache() { store.clear(); log("cache cleared"); }

// The login token + the in-flight login live on globalThis: Next.js (dev: every hot reload, and each route is bundled separately) re-runs this
// module many times, and module-level variables made EVERY copy log in again, a pile of parallel bcrypt logins that timed out the backend.
const auth = globalThis.__dokaniAuth || (globalThis.__dokaniAuth = { session: null, pendingLogin: null }); // session = { token, exp }; pendingLogin: ten parallel requests share ONE login call

// At most DOKANI_MAX_PARALLEL (default 4) requests run against Dokani at the same time; the rest wait their turn. A single-threaded backend
// (php artisan serve) answers faster this way than when 10+ requests arrive together and each one times out.
const MAX_PARALLEL = Math.max(1, Number(process.env.DOKANI_MAX_PARALLEL) || 4);
const gate = globalThis.__dokaniGate || (globalThis.__dokaniGate = { active: 0, queue: [] });
async function withSlot(task) {
  if (gate.active >= MAX_PARALLEL) await new Promise((resolve) => gate.queue.push(resolve));
  gate.active++;
  try { return await task(); }
  finally { gate.active--; gate.queue.shift()?.(); }
}
const isTimeout = (e) => /timeout|aborted|fetch failed|ECONN|socket/i.test(String(e?.message || e?.cause?.message || ""));

export function resetSession() { auth.session = null; auth.pendingLogin = null; }

export function dokaniLogin() {
  if (auth.pendingLogin) return auth.pendingLogin;
  auth.pendingLogin = (async () => {
    const c = cfg();
    if (!c.baseUrl || !c.login || !c.password) throw new DokaniError("Dokani is not configured: set DOKANI_BASE_URL, DOKANI_LOGIN and DOKANI_PASSWORD in .env.local");
    const body = new FormData(); // the API expects form-data: login, password
    body.set("login", c.login); body.set("password", c.password);
    let res;
    const attempt = () => fetch(`${c.baseUrl}/login/`, { method: "POST", body, headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(40000) });
    try { try { res = await attempt(); } catch (e) { if (!isTimeout(e)) throw e; log("login timed out, trying once more"); res = await attempt(); } }
    catch (e) { throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`); }
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.token) throw new DokaniError(json?.message || `Dokani login failed (HTTP ${res.status}). Check DOKANI_LOGIN and DOKANI_PASSWORD.`, { status: res.status, data: json });
    auth.session = { token: json.token, exp: Date.now() + TOKEN_TTL_MS };
    return auth.session;
  })().finally(() => { auth.pendingLogin = null; });
  return auth.pendingLogin;
}

async function token() {
  if (!auth.session || Date.now() > auth.session.exp) await dokaniLogin();
  return auth.session.token;
}

// GET {baseUrl}{path}?{query} with the Bearer token. One automatic re-login if Dokani answers 401.
export function dokaniGet(path, query = {}, { retried = false, ttl = 0 } = {}) {
  if (!(ttl > 0) || retried) return dokaniFetch(path, query, { retried });
  const key = `${path}?${Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}=${v}`).sort().join("&")}`;
  const hit = store.get(key);
  const age = hit ? Date.now() - hit.at : Infinity;
  if (hit && age < ttl) { log("HIT  ", key); return Promise.resolve(hit.value); }
  if (!hit?.pending) {
    const pending = dokaniFetch(path, query)
      .then((value) => { store.set(key, { at: Date.now(), value, pending: null }); return value; })
      .catch((error) => { const old = store.get(key); if (old) old.pending = null; throw error; });
    if (hit) hit.pending = pending; else store.set(key, { at: 0, value: undefined, pending });
    if (store.size > 400) store.delete(store.keys().next().value);
  }
  const current = store.get(key);
  if (hit && age < STALE_LIMIT_MS) { log("STALE", key); current.pending?.catch(() => {}); return Promise.resolve(hit.value); }
  log("MISS ", key);
  return current.pending;
}

async function dokaniFetch(path, query = {}, { retried = false } = {}) {
  const c = cfg();
  const startedAt = Date.now();
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])).toString();
  let res;
  try {
    const bearer = await token();
    const attempt = () => fetch(`${c.baseUrl}${path}${qs ? `?${qs}` : ""}`, { headers: { Accept: "application/json", Authorization: `Bearer ${bearer}` }, cache: "no-store", signal: AbortSignal.timeout(30000) });
    res = await withSlot(async () => { try { return await attempt(); } catch (e) { if (!isTimeout(e)) throw e; log("retry", path); return attempt(); } }); // GET is safe to repeat
  } catch (e) {
    if (e instanceof DokaniError) throw e;
    throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`);
  }
  if (res.status === 401 && !retried) { resetSession(); return dokaniFetch(path, query, { retried: true }); }
  const json = await res.json().catch(() => null);
  log(`GET ${path}${qs ? `?${qs}` : ""} -> ${res.status} in ${Date.now() - startedAt}ms`);
  if (!res.ok || json?.success === false) throw new DokaniError(json?.message || `Dokani request failed (HTTP ${res.status}) for ${path}`, { status: res.status, data: json });
  return json;
}

// JSON request for server-side proxy routes. Return non-2xx payloads to the caller so it can preserve Laravel's status and validation body.
export async function dokaniSend(method, path, body, { retried = false } = {}) {
  const c = cfg();
  let res;
  try {
    res = await fetch(`${c.baseUrl}${path}`, {
      method, cache: "no-store", signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/json", ...(body !== undefined && { "Content-Type": "application/json" }), Authorization: `Bearer ${await token()}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e instanceof DokaniError) throw e;
    throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`);
  }
  if (res.status === 401 && !retried) { resetSession(); return dokaniSend(method, path, body, { retried: true }); }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

// Safety net for a multi-shop platform: every Dokani row carries its shop_id. If it is not DOKANI_SHOP_ID we are logged in to the wrong shop.
export function assertShop(rows) {
  const want = cfg().shopId;
  if (!want) return;
  const bad = (rows || []).find((r) => r && r.shop_id != null && String(r.shop_id) !== want);
  if (bad) throw new DokaniError(`Wrong Dokani shop: the data belongs to shop ${bad.shop_id} but DOKANI_SHOP_ID is ${want}. Check DOKANI_LOGIN in .env.local.`);
}
