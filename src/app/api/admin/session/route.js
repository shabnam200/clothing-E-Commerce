import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminSession } from "@/services/dokani/adminSession";
export const dynamic = "force-dynamic";
export async function GET() {
  const admin = await getAdminSession();
  const response = NextResponse.json({ authenticated: !!admin }, { headers: { "Cache-Control": "no-store" } });
  if (admin) response.cookies.set("avenor_admin_hint", "1", { sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
  else response.cookies.set("avenor_admin_hint", "", { sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  if (!admin) response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
