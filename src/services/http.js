import { API_URL, REQUEST_TIMEOUT, SHOP_ID } from "./config";
import { ApiError } from "./errors";
import { tokenStore } from "./tokenStore";

// Language the person is browsing in. Server code passes it explicitly; in the browser it is read from the "lang" cookie.
export function currentLang() {
  if (typeof document === "undefined") return "bn";
  const m = document.cookie.match(/(?:^|;\s*)lang=(en|bn)/);
  return m ? m[1] : "bn";
}

const qs = (query) => {
  if (!query) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    p.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

// Thin fetch wrapper: JSON in/out, Bearer token, Accept-Language, timeout and normalised errors.
//   auth: false      -> never send the token (public endpoints)
//   lang             -> Accept-Language (bn | en)
//   revalidate: n    -> (server only) let Next.js cache this GET for n seconds
// A 401 on an authenticated call fires "avenor:auth-expired" so the app can sign the user out and show the login popup.
export async function http(path, { method = "GET", body, query, auth = true, lang, revalidate, headers: extra, base = API_URL } = {}) {
  const headers = { Accept: "application/json", "Accept-Language": lang || currentLang(), ...(SHOP_ID && { "X-Shop-Id": SHOP_ID }), ...extra };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
  const init = { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal };
  if (revalidate && method === "GET" && typeof window === "undefined") init.next = { revalidate };

  let res;
  try {
    res = await fetch(`${base}${path}${qs(query)}`, init);
  } catch (e) {
    throw new ApiError(e?.name === "AbortError" ? "The server took too long to respond. Please try again." : "Network error. Please check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth && token && typeof window !== "undefined") {
      tokenStore.clear();
      window.dispatchEvent(new Event("avenor:auth-expired"));
    }
    const fallback = res.status === 429 ? "Too many attempts. Please wait a moment." : `Request failed (${res.status})`;
    throw new ApiError(data?.message || data?.error || fallback, {
      status: res.status,
      errors: data?.errors ?? null,
      reason: data?.reason ?? data?.errors?.reason?.[0] ?? null,
      data,
    });
  }
  return data;
}

// Laravel resources wrap payloads as { data: ... }; accept both shapes.
export const unwrap = (json) => (json && typeof json === "object" && !Array.isArray(json) && "data" in json ? json.data : json);
export const metaOf = (json, fallbackLen = 0) => json?.meta ?? { page: 1, limit: fallbackLen, total: fallbackLen, last_page: 1 };
