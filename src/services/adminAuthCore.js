/** Pure checks shared by the server routes and Node tests. The admin identity always comes from the server's env, never from the request. */

const digitsOnly = (v) => String(v ?? "").replace(/\D/g, "");
/** 01712-345678, +8801712345678, 8801712345678 -> 01712345678. Anything that is not a Bangladeshi mobile number -> "". */
export function normalizeBdPhone(v) {
  let d = digitsOnly(v);
  if (d.startsWith("880")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("1")) d = `0${d}`;
  return /^01[3-9]\d{8}$/.test(d) ? d : "";
}

/**
 * The website's normal login form is also the admin's login. A sign-in counts as an ADMIN attempt only when what was typed is exactly
 * ADMIN_EMAIL, or (optional) exactly ADMIN_PHONE. Every other sign-in is an ordinary customer login and never touches the staff login.
 */
export function isAdminIdentifier(adminEmail, identifier, adminPhone = "") {
  const typed = typeof identifier === "string" ? identifier.trim() : "";
  if (!typed) return false;
  const email = typeof adminEmail === "string" ? adminEmail.trim().toLowerCase() : "";
  if (email && typed.toLowerCase() === email) return true;
  const phone = normalizeBdPhone(adminPhone);
  return Boolean(phone) && normalizeBdPhone(typed) === phone;
}

/** Body for the staff login (Dokani POST /login/). A phone is sent as 01XXXXXXXXX, an email as typed. */
export function adminLoginBody(adminEmail, identifier, password, adminPhone = "") {
  if (!isAdminIdentifier(adminEmail, identifier, adminPhone) || typeof password !== "string" || !password || password.length > 200) return null;
  const typed = identifier.trim();
  return { login: typed.includes("@") ? typed : normalizeBdPhone(typed), password };
}

export function isVerifiedAdmin(status, data) {
  return status === 200 && data?.admin?.authorized === true
    && Number.isSafeInteger(Number(data.admin.id)) && Number(data.admin.id) > 0
    && Number.isSafeInteger(Number(data.admin.shop_id)) && Number(data.admin.shop_id) > 0;
}
export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  return !!origin && origin === new URL(request.url).origin;
}

/** Small in-memory brake for repeated wrong admin passwords (per client key). */
export function createLimiter({ max = 6, windowMs = 15 * 60 * 1000, now = () => Date.now() } = {}) {
  const hits = new Map();
  const fresh = (key) => { const t = now(); const list = (hits.get(key) || []).filter((x) => t - x < windowMs); hits.set(key, list); return list; };
  return { blocked: (key) => fresh(key).length >= max, fail: (key) => { fresh(key).push(now()); }, reset: (key) => hits.delete(key) };
}
