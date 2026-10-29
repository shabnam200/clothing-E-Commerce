import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/services/dokani/adminSession";
import { isSameOrigin } from "@/services/adminAuthCore";
export async function POST(request) {
  if (!isSameOrigin(request)) return NextResponse.json({ message: "Request rejected." }, { status: 403 });
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
