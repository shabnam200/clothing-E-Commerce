import { adminResponses, handleShopper } from "@/services/dokani/shopper";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/services/dokani/adminSession";

// Same-origin gateway to Dokani Cloud's shopper accounts (see services/dokani/shopper.js).
//   POST /api/shopper/register   POST /api/shopper/login        (the server adds the shop's service token)
//   GET  /api/shopper/me         PUT  /api/shopper/profile      POST /api/shopper/password     POST /api/shopper/logout   (the shopper's own token is passed through)
export const dynamic = "force-dynamic";

// The action is the one part after /api/shopper/ . (Read from the URL so it works the same on every Next.js version.)
const actionOf = (request) => new URL(request.url).pathname.replace(/^.*\/api\/shopper\//, "").replace(/\/$/, "");
const handle = async (request) => {
  const action = actionOf(request);
  const result = await handleShopper(request, action);

  // A browser session must represent either a shopper or an administrator.
  // Successful shopper authentication revokes any previously issued admin session.
  if (adminResponses.has(result)) return result; // the admin signed in: keep the admin cookie that was just set
  if (["login", "register"].includes(action) && result.ok) {
    const response = new NextResponse(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
    });
    response.cookies.set(ADMIN_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  return result;
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
