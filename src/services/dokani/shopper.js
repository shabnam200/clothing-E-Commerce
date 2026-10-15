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
  const publicShopLists = { "catalog/products": "/shops/products", "catalog/categories": "/shops/category", "catalog/companies": "/shops/companies", "catalog/units": "/shops/units" };
  if (method === "GET" && publicShopLists[action]) return { path: publicShopLists[action], service: true, query: true };
  let product = action.match(/^catalog\/products\/(\d+)$/);
  if (method === "GET" && product) return { path: `/shops/products/${product[1]}`, service: true };
  if (method === "GET" && /^reviews\/\d+$/.test(action)) {
    return { path: `/products/${action.split("/")[1]}/reviews`, service: true, query: true };
  }
  if (["GET", "POST"].includes(method) && ["addresses", "users/addresses"].includes(action)) return { path: `/${action}` };
  let m = action.match(/^(?:users\/)?addresses\/(\d+)(?:\/(default))?$/);
  if (m && method === "PUT") return { path: `/addresses/${m[1]}${m[2] ? "/default" : ""}` };
  if (m && method === "DELETE") return { path: `/addresses/${m[1]}` };
  m = action.match(/^products\/(\d+)\/reviews$/);
  if (m && method === "POST") return { path: `/products/${m[1]}/reviews` };
  m = action.match(/^reviews\/(\d+)\/helpful$/);
  if (m && method === "POST") return { path: `/reviews/${m[1]}/helpful` };
  m = action.match(/^reviews\/(\d+)$/);
  if (m && method === "DELETE") return { path: `/reviews/${m[1]}` };
  m = action.match(/^products\/(\d+)\/related$/);
  if (m && method === "GET") return { path: `/products/${m[1]}/related`, query: true };
  m = action.match(/^products\/(\d+)\/(price-alert|notify)$/);
  if (m && ["POST", "DELETE"].includes(method)) return { path: `/products/${m[1]}/${m[2]}` };
  return ROUTES[`${method} ${action}`];
}

const json = (status, data, headers = {}) => new Response(status === 204 || data === null ? null : JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });

// request: a standard Request.  action: "login" | "register" | "me" | ...   Returns a standard Response.
export async function handleShopper(request, action) {
  const route = routeFor(request.method, action);
  if (!route) return json(404, { message: "Not found." });
  if (!isEnabled()) return json(503, { message: "Accounts are not available right now. Please try again later." });

  let body;
  if (route.body) {
    const raw = await request.json().catch(() => null);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json(422, { message: "Invalid request." });
    body = route.body(raw);
  } else if (["POST", "PUT", "PATCH"].includes(request.method)) {
    body = await request.json().catch(() => undefined);
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
      const query = route.query ? new URL(request.url).search : "";
      res = await fetch(`${cfg().baseUrl}${route.path}${query}`, {
        method: request.method, cache: "no-store", signal: AbortSignal.timeout(15000), body: body === undefined ? undefined : JSON.stringify(body),
        headers: { Accept: "application/json", ...(body !== undefined && { "Content-Type": "application/json" }), Authorization: auth },
      });
    } catch (e) { throw new DokaniError(`Could not reach Dokani (${e?.message || "network error"})`); }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    return json(res.status, data ?? (res.status >= 400 ? { message: `Request failed (${res.status})` } : null));
  } catch (e) {
    console.error("[shopper]", action, e?.message || e); // the real reason stays in the server log, never in the page
    return json(502, { message: "We could not reach the server. Please try again in a moment." });
  }
}
