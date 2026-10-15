// Minimal Dokani Cloud HTTP client: login once, keep the token on the server, add it to every call, log in again when it dies.
import { TOKEN_TTL_MS, cfg } from "./config";

export class DokaniError extends Error {
  constructor(message, { status = 0, data = null } = {}) { super(message); this.name = "DokaniError"; this.status = status; this.data = data; }
}

let session = null;       // { token, exp }
let pendingLogin = null;  // so ten parallel requests share ONE login call

export function resetSession() { session = null; pendingLogin = null; }

export function dokaniLogin() {
  if (pendingLogin) return pendingLogin;
  pendingLogin = (async () => {
    const c = cfg();
    if (!c.baseUrl || !c.login || !c.password) throw new DokaniError("Dokani is not configured: set DOKANI_BASE_URL, DOKANI_LOGIN and DOKANI_PASSWORD in .env.local");
    const body = new FormData(); // the API expects form-data: login, password
    body.set("login", c.login); body.set("password", c.password);
    let res;
    try { res = await fetch(`${c.baseUrl}/login/`, { method: "POST", body, headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15000) }); }
    catch (e) { throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`); }
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.token) throw new DokaniError(json?.message || `Dokani login failed (HTTP ${res.status}). Check DOKANI_LOGIN and DOKANI_PASSWORD.`, { status: res.status, data: json });
    session = { token: json.token, exp: Date.now() + TOKEN_TTL_MS };
    return session;
  })().finally(() => { pendingLogin = null; });
  return pendingLogin;
}

async function token() {
  if (!session || Date.now() > session.exp) await dokaniLogin();
  return session.token;
}

// Server-side authenticated JSON request. The service token remains on Next.js.
export async function dokaniSend(method, path, body, { retried = false } = {}) {
  const c = cfg();
  let res;
  try {
    res = await fetch(`${c.baseUrl}${path}`, {
      method,
      headers: { Accept: "application/json", Authorization: `Bearer ${await token()}`, ...(body !== undefined && { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) { throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`); }
  if (res.status === 401 && !retried) { resetSession(); return dokaniSend(method, path, body, { retried: true }); }
  return { status: res.status, data: res.status === 204 ? null : await res.json().catch(() => null) };
}

// GET {baseUrl}{path}?{query} with the Bearer token. One automatic re-login if Dokani answers 401.
export async function dokaniGet(path, query = {}, { retried = false } = {}) {
  const c = cfg();
  const qs = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])).toString();
  let res;
  try {
    res = await fetch(`${c.baseUrl}${path}${qs ? `?${qs}` : ""}`, { headers: { Accept: "application/json", Authorization: `Bearer ${await token()}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  } catch (e) {
    if (e instanceof DokaniError) throw e;
    throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`);
  }
  if (res.status === 401 && !retried) { resetSession(); return dokaniGet(path, query, { retried: true }); }
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) throw new DokaniError(json?.message || `Dokani request failed (HTTP ${res.status}) for ${path}`, { status: res.status, data: json });
  return json;
}

// Safety net for a multi-shop platform: every Dokani row carries its shop_id. If it is not DOKANI_SHOP_ID we are logged in to the wrong shop.
export function assertShop(rows) {
  const want = cfg().shopId;
  if (!want) return;
  const bad = (rows || []).find((r) => r && r.shop_id != null && String(r.shop_id) !== want);
  if (bad) throw new DokaniError(`Wrong Dokani shop: the data belongs to shop ${bad.shop_id} but DOKANI_SHOP_ID is ${want}. Check DOKANI_LOGIN in .env.local.`);
}
