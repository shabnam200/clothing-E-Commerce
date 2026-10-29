import { cookies } from "next/headers";
import { cfg } from "./config";
import { isVerifiedAdmin } from "../adminAuthCore";

export const ADMIN_COOKIE = "avenor_admin_session";

// Asks Laravel whether this staff token is the allowed website admin (ADMIN_EMAIL + the "website_control" permission). Returns { admin, status }.
async function checkAdminToken(token) {
  const { baseUrl } = cfg();
  if (!token || !baseUrl) return { admin: null, status: 0 };
  try {
    const response = await fetch(`${baseUrl}/auth/admin/me`, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10000), headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => null);
    return { admin: isVerifiedAdmin(response.status, data) ? data.admin : null, status: response.status };
  } catch { return { admin: null, status: 0 }; }
}
// A successful check is remembered for a short time, so opening Website Control does not ask the backend "is this the admin?" again for every
// request (that was 4+ slow round trips). Anything that changes data always asks again (`fresh`). Only a verified admin is ever stored.
const VERIFY_TTL_MS = 30_000;
const verifiedAdmins = globalThis.__avenorVerifiedAdmins || (globalThis.__avenorVerifiedAdmins = new Map());
export async function verifyAdminToken(token, { fresh = false } = {}) {
  if (!token) return null;
  const hit = verifiedAdmins.get(token);
  if (!fresh && hit && hit.expires > Date.now()) return hit.admin;
  const { admin } = await checkAdminToken(token);
  if (admin) {
    if (verifiedAdmins.size > 50) verifiedAdmins.clear();
    verifiedAdmins.set(token, { admin, expires: Date.now() + VERIFY_TTL_MS });
  } else {
    verifiedAdmins.delete(token);
  }
  return admin;
}
export const forgetAdminToken = (token) => { if (token) verifiedAdmins.delete(token); };

export async function getAdminSession() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}
export async function getAdminAccessToken({ fresh = false } = {}) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return await verifyAdminToken(token, { fresh }) ? token : null;
}

// Reads one JSON document from the backend as the admin (used to load the settings together with the page). Returns null on any problem.
export async function adminBackendGet(path, token) {
  const { baseUrl } = cfg();
  if (!token || !baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}${path}`, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

// ---- unified sign-in: the normal website login form, when what was typed is ADMIN_EMAIL / ADMIN_PHONE --------------------------------
// 1) the staff login (Dokani POST /login/) proves the password, 2) GET /auth/admin/me proves this account is the allowed admin.
// The token then lives ONLY in an httpOnly cookie, never in the browser's JavaScript.
export const adminCookie = (token, maxAge = 6 * 60 * 60) => ({ name: ADMIN_COOKIE, value: token, options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge } });

// Returns the staff token when the credentials are the verified admin's, otherwise null. The BROWSER is never told why (it always sees "Invalid email or password."),
// but the reason is written to the server log so the person setting the site up can fix it.
export async function adminSignIn(body, { quiet = false } = {}) {
  const { baseUrl } = cfg();
  if (!body || !baseUrl) { console.error("[admin-login] DOKANI_BASE_URL is not set on the Next.js server."); return null; }
  try {
    const login = await fetch(`${baseUrl}/login/`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await login.json().catch(() => null);
    if (!login.ok || data?.status !== true || typeof data?.token !== "string") { if (!quiet) console.error(`[admin-login] staff login refused (HTTP ${login.status}): wrong password, or this e-mail/phone is not a Dokani staff user.`); return null; }
    const { admin, status } = await checkAdminToken(data.token);
    if (!admin) { console.error(`[admin-login] password OK, but /auth/admin/me answered HTTP ${status}. On the BACKEND check: ADMIN_EMAIL in its .env equals this staff user's e-mail, and this user's role has the "website_control" permission (module "storefront").`); return null; }
    return data.token;
  } catch (e) { console.error("[admin-login] backend request failed:", e?.message || e); return null; }
}