// ---------------------------------------------------------------------------
// Host proxy (Next.js 16 name for the old middleware.js; on Next 15 or older rename this file to middleware.js
// and rename the exported function `proxy` to `middleware`).
//
// What it does: a visitor opens the store on some host. We ask the backend which shop owns that host and what the
// shop's MAIN address is:
//     shop has a custom domain  -> main address = that domain
//     shop has no custom domain -> main address = <subdomain>.<platform domain>
// If the visitor is on any other address of the same shop, they are redirected (308) to the main address.
//
// It is OFF by default. Turn it on with  HOST_REDIRECT_ENABLED=true  (see services/.env.example).
// It never blocks the site: if the backend is slow, down, or does not know the host, the request just continues.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";

const ENABLED = () => String(process.env.HOST_REDIRECT_ENABLED || "").toLowerCase() === "true";
const apiBase = () => (process.env.DOKANI_BASE_URL || "").replace(/\/$/, "");

// In-memory cache (survives hot reloads): one /storefront/resolve call per host per minute, failures included, so a slow or
// missing endpoint never delays every page load. In dev (`next dev`) the lookup is skipped completely.
const resolved = globalThis.__hostResolveCache || (globalThis.__hostResolveCache = new Map()); // host -> { at, value, pending }
const OK_MS = 60 * 1000, FAIL_MS = 5 * 60 * 1000;

async function fetchHost(host) {
  const base = apiBase();
  if (!base) return null;
  try {
    const response = await fetch(`${base}/storefront/resolve?host=${encodeURIComponent(host)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.success ? json.data : null;
  } catch {
    return null;
  }
}

async function resolveHost(host) {
  const hit = resolved.get(host);
  if (hit) {
    const ttl = hit.value ? OK_MS : FAIL_MS;
    if (Date.now() - hit.at < ttl) return hit.value;
    if (hit.value) { // stale-while-revalidate: answer now, refresh in the background
      if (!hit.pending) hit.pending = fetchHost(host).then((v) => resolved.set(host, { at: Date.now(), value: v ?? hit.value, pending: null })).catch(() => { hit.pending = null; });
      return hit.value;
    }
  }
  const value = await fetchHost(host);
  resolved.set(host, { at: Date.now(), value, pending: null });
  if (resolved.size > 50) resolved.delete(resolved.keys().next().value);
  return value;
}

export async function proxy(request) {
  if (!ENABLED() || process.env.NODE_ENV === "development") return NextResponse.next(); // dev: no host lookup, no extra wait
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next(); // only page loads are redirected

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim().toLowerCase();
  if (!host) return NextResponse.next();

  const shop = await resolveHost(host);
  if (!shop) return NextResponse.next();

  // One deployment = one shop (DOKANI_SHOP_ID). If the host belongs to a DIFFERENT shop, this site must not answer for it
  // (wrong DNS / wrong server routing), so show a plain 404 instead of another shop's store under that shop's domain.
  const ownShopId = String(process.env.DOKANI_SHOP_ID || "").trim();
  if (ownShopId && String(shop.shop_id) !== ownShopId) return new NextResponse("Not found", { status: 404 });

  if (shop.needs_redirect && shop.canonical_url) {
    const target = new URL(shop.canonical_url); // built by our own backend from the database, never from the request
    target.pathname = request.nextUrl.pathname;
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  // Tell the pages which shop this host belongs to (handy when one app serves many shops).
  const headers = new Headers(request.headers);
  headers.set("x-shop-id", String(shop.shop_id));
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: skip API routes, Next internals and files with an extension (images, fonts, favicon ...).
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
