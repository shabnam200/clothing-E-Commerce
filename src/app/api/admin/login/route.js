import { NextResponse } from "next/server";
import { cfg } from "@/services/dokani/config";
import { ADMIN_COOKIE, verifyAdminToken } from "@/services/dokani/adminSession";
import { isSameOrigin, normalizeBdPhone } from "@/services/adminAuthCore";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
export async function POST(request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Request rejected." }, { status: 403, headers: noStore });
  const raw = await request.json().catch(() => null);
  // The backend's /auth/admin/me endpoint is the authority for storefront access.
  // Do not require the Next deployment to duplicate the backend's admin allowlist.
  const typedLogin = typeof raw?.phone === "string" ? raw.phone.trim() : "";
  const login = typedLogin.includes("@") ? typedLogin : normalizeBdPhone(typedLogin);
  const credentials = login && typeof raw?.password === "string" && raw.password.length > 0 && raw.password.length <= 200
    ? { login, password: raw.password }
    : null;
  const { baseUrl } = cfg();
  if (!credentials || !baseUrl) return NextResponse.json({ message: "Admin login is not configured." }, { status: 503, headers: noStore });
  try {
    const login = await fetch(`${baseUrl}/login/`, { method: "POST", cache: "no-store", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const loginData = await login.json().catch(() => null);
    if (!login.ok || loginData?.status !== true || typeof loginData?.token !== "string") return NextResponse.json({ message: "Invalid administrator credentials." }, { status: 401, headers: noStore });
    const admin = await verifyAdminToken(loginData.token);
    if (!admin) return NextResponse.json({ message: "Administrator access is not enabled for this account." }, { status: 403, headers: noStore });
    const response = NextResponse.json({ authenticated: true }, { headers: noStore });
    response.cookies.set(ADMIN_COOKIE, loginData.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/" }); // session cookie: ends when the browser closes
    response.cookies.set("avenor_admin_hint", "1", { sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
    return response;
  } catch (error) {
    console.error("[admin-login] backend request failed", error?.message || error);
    return NextResponse.json({ message: "Administrator sign-in is temporarily unavailable." }, { status: 502, headers: noStore });
  }
}
