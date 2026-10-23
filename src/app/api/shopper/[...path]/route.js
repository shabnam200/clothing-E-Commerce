import { handleShopper } from "@/services/dokani/shopper";

// Same-origin gateway to Dokani Cloud's shopper accounts (see services/dokani/shopper.js).
//   POST /api/shopper/register   POST /api/shopper/login        (the server adds the shop's service token)
//   GET  /api/shopper/me         PUT  /api/shopper/profile      POST /api/shopper/password     POST /api/shopper/logout   (the shopper's own token is passed through)
export const dynamic = "force-dynamic";

// The action is the one part after /api/shopper/ . (Read from the URL so it works the same on every Next.js version.)
const actionOf = (request) => new URL(request.url).pathname.replace(/^.*\/api\/shopper\//, "").replace(/\/$/, "");
const handle = (request) => handleShopper(request, actionOf(request));

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
