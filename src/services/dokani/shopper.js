// Shopper (website customer) accounts: the SERVER half. Used only by  app/api/shopper/[...path]/route.js .  SERVER ONLY.
//
//   browser  --(same origin)-->  /api/shopper/<action>  --(this file)-->  Laravel  /api/auth/<action>
//
// Laravel's  register / login  must be called with the shop's SERVICE token (it tells the API which shop / tenant database to use).
// That token must never reach the browser, so the browser calls this proxy and the proxy adds it.
// me / profile / password / logout  use the SHOPPER's own token (returned by register / login): the proxy only passes it through.
// Nothing here parses or stores the shopper token; Laravel does all the checking.
import { DokaniError, dokaniSend } from "./client";
import { cfg, isEnabled } from "./config";

const pickKeys = (o, keys) => Object.fromEntries(keys.filter((k) => o && o[k] !== undefined).map((k) => [k, o[k]]));
const text = (v) => (typeof v === "string" ? v : v == null ? undefined : String(v));

// action -> how to call Laravel.  `service: true` = the shop's service token, otherwise the shopper's own token is passed through.
// Only these keys are forwarded, so the browser cannot inject anything else into the Laravel request.
const ROUTES = {
  "POST register": { path: "/auth/register", service: true, body: (b) => ({ ...pickKeys(b, ["name", "email", "phone", "identifier", "password", "birth_date"]), source: "avenor" }) },
  "POST login": { path: "/auth/login", service: true, body: (b) => pickKeys(b, ["login", "identifier", "email", "phone", "password"]) },
  "GET me": { path: "/auth/me" },
  "PUT profile": { path: "/auth/profile", body: (b) => pickKeys(b, ["name", "email", "phone", "birth_date", "preferences"]) },
  "POST password": { path: "/auth/password", body: (b) => ({ current: text(b?.current ?? b?.current_password), next: text(b?.next ?? b?.new_password) }) },
  "POST logout": { path: "/auth/logout" },
};

function routeFor(method, action) {
  const publicRoutes = {
    "catalog/products": "/shops/products", "catalog/categories": "/shops/category",
    "catalog/companies": "/shops/companies", "catalog/units": "/shops/units",
    campaigns: "/campaigns", settings: "/settings", "delivery/options": "/delivery/options", genders: "/genders",
  };
  if (method === "GET" && publicRoutes[action]) return { path: publicRoutes[action], service: true, query: true };
  if (method === "POST" && action === "support") return { path: "/support", service: true, body: (b) => pickKeys(b, ["name", "contact", "order", "topic", "message"]) };
  if (method === "POST" && action === "newsletter/subscribe") return { path: "/newsletter/subscribe", service: true, body: (b) => pickKeys(b, ["email"]) };
  let m = action.match(/^catalog\/products\/(\d+)$/);
  if (method === "GET" && m) return { path: `/shops/products/${m[1]}`, service: true };
  m = action.match(/^products\/(\d+)\/related$/);
  if (method === "GET" && m) return { path: `/storefront/products/${m[1]}/related`, service: true, query: true };
  m = action.match(/^reviews\/(\d+)$/);
  if (method === "GET" && m) return { path: `/products/${m[1]}/reviews`, service: true, query: true };
  m = action.match(/^orders\/(\d+|AVN-[0-9a-fA-F-]{36})\/cancel$/);
  if (method === "POST" && m) return { path: `/orders/${m[1]}/cancel` };
  m = action.match(/^orders\/(\d+|AVN-[0-9a-fA-F-]{36})\/return$/);
  if (method === "POST" && m) return { path: `/orders/${m[1]}/returns` };
  m = action.match(/^orders\/(\d+|AVN-[0-9a-fA-F-]{36})$/);
  if (method === "GET" && m) return { path: `/orders/${m[1]}` };
  if (method === "GET" && action === "orders") return { path: "/orders", query: true };
  if (["GET", "POST"].includes(method) && action === "wishlist") return { path: "/wishlist" };
  m = action.match(/^wishlist\/(\d+)$/);
  if (method === "DELETE" && m) return { path: `/wishlist/${m[1]}` };
  if (["GET", "PUT", "DELETE"].includes(method) && action === "cart") return { path: "/cart" };
  if (method === "POST" && action === "cart/outfit") return { path: "/cart/outfit" };
  if (method === "POST" && action === "cart/items") return { path: "/cart/items" };
  m = action.match(/^cart\/items\/(\d+)$/);
  if (["PUT", "DELETE"].includes(method) && m) return { path: `/cart/items/${m[1]}` };
  if (method === "POST" && action === "coupons/validate") return { path: "/coupons/validate" };
  if (["GET", "PUT"].includes(method) && action === "users/size-passport") return { path: "/users/size-passport" };
  if (method === "DELETE" && ["size-passport", "users/size-passport"].includes(action)) return { path: "/size-passport" };
  if (method === "GET" && action === "referrals/me") return { path: "/referrals/me" };
  if (method === "POST" && action === "referrals/apply") return { path: "/referrals/apply" };
  if (method === "GET" && action === "alerts") return { path: "/alerts" };
  if (["GET", "PUT"].includes(method) && action === "alerts/preferences") return { path: "/alerts/preferences" };
  m = action.match(/^alerts\/(\d+)$/);
  if (["PUT", "DELETE"].includes(method) && m) return { path: `/alerts/${m[1]}` };
  m = action.match(/^products\/(\d+)\/(price-alert|notify)$/);
  if (["POST", "DELETE"].includes(method) && m) return { path: `/products/${m[1]}/${m[2]}` };
  if (["GET", "POST"].includes(method) && ["addresses", "users/addresses"].includes(action)) return { path: `/${action}` };
  m = action.match(/^(?:users\/)?addresses\/(\d+)(?:\/(default))?$/);
  if (m && method === "PUT") return { path: `/addresses/${m[1]}${m[2] ? "/default" : ""}` };
  if (m && method === "DELETE") return { path: `/addresses/${m[1]}` };
  m = action.match(/^products\/(\d+)\/reviews$/);
  if (m && method === "POST") return { path: `/products/${m[1]}/reviews` };
  m = action.match(/^reviews\/(\d+)\/helpful$/);
  if (m && method === "POST") return { path: `/reviews/${m[1]}/helpful` };
  m = action.match(/^reviews\/(\d+)$/);
  if (m && method === "DELETE") return { path: `/reviews/${m[1]}` };
  return ROUTES[`${method} ${action}`];
}

const json = (status, data, headers = {}) => new Response(status === 204 || data === null ? null : JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

// request: a standard Request.  action: "login" | "register" | "me" | ...   Returns a standard Response.
export async function handleShopper(request, action) {
  const route = routeFor(request.method, action);
  if (!route) return json(404, { message: "Not found." });
  if (route.service && !isEnabled()) return json(503, { message: "Dokani API is not configured. Set DOKANI_BASE_URL, DOKANI_LOGIN and DOKANI_PASSWORD on the Next.js server." });

  let body;
  if (route.body) {
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json(422, { message: "Invalid request." });
    body = route.body(raw);
  } else if (!["GET", "HEAD"].includes(request.method)) {
    // Forward JSON bodies for shopper-owned cart, address, and account routes too.
    // Previously only routes with a body-transform function read the request, so POST /cart/items
    // reached Laravel with an empty body and failed `product_id` validation.
    const raw = await request.json().catch(() => null);
    if (raw !== null && (typeof raw !== "object" || Array.isArray(raw))) return json(422, { message: "Invalid request." });
    body = raw ?? undefined;
  }

  try {
    if (route.service) {
      const query = route.query ? new URL(request.url).search : "";
      const r = await dokaniSend(request.method, `${route.path}${query}`, body);
      return json(r.status, r.data ?? (r.status >= 400 ? { message: `Request failed (${r.status})` } : null));
    }
    // shopper token: pass straight through
    const auth = request.headers.get("authorization");
    if (!auth) return json(401, { message: "Please log in to continue." });
    let res;
    try {
      res = await fetch(`${cfg().baseUrl}${route.path}`, {
        method: request.method, cache: "no-store", signal: AbortSignal.timeout(15000), body: body === undefined ? undefined : JSON.stringify(body),
        headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: auth },
      });
    } catch (e) { throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`); }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    return json(res.status, data ?? (res.status >= 400 ? { message: `Request failed (${res.status})` } : null));
  } catch (e) {
    console.error("[shopper]", action, e?.message || e); // the real reason stays in the server log, never in the page
    return json(502, { message: "We could not reach the server. Please try again in a moment." });
  }
}