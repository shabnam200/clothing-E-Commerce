import { cookies } from "next/headers";
import { cfg } from "./config";
import { isVerifiedAdmin } from "../adminAuthCore";
export const ADMIN_COOKIE = "avenor_admin_session";
export async function verifyAdminToken(token) {
  const { baseUrl } = cfg();
  if (!token || !baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}/auth/admin/me`, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(10000), headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => null);
    return isVerifiedAdmin(response.status, data) ? data.admin : null;
  } catch { return null; }
}
export async function getAdminSession() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(ADMIN_COOKIE)?.value);
}
export async function getAdminAccessToken() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return await verifyAdminToken(token) ? token : null;
}
