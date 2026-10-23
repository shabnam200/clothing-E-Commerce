// ---------------------------------------------------------------------------
// Backend switch (the ONLY place that decides mock vs. real).
//   NEXT_PUBLIC_API_URL empty                    -> MOCK mode: a browser-only fake server (no backend needed)
//   NEXT_PUBLIC_API_URL=https://api.example.com/api -> REAL mode: services/httpApi.js talks to the Laravel API
// Full connection guide: services/README.md
// ---------------------------------------------------------------------------
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const USE_MOCK = !API_URL;
// Allow Dokani shopper accounts to authenticate while the rest of the storefront
// remains on its local mock cart/catalog settings.
export const DOKANI_AUTH = process.env.NEXT_PUBLIC_DOKANI_AUTH === "1";

// Mock only: artificial delay (ms) so loading states are visible while building. Set 0 to switch off.
export const MOCK_LATENCY = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY ?? 200);

// Which shop this website sells for (a Dokani Cloud shop id). Sent on every request as the header  X-Shop-Id  so the backend
// knows which shop's products, stock and sales to use. Leave empty for a single-shop backend.
export const SHOP_ID = (process.env.NEXT_PUBLIC_SHOP_ID || "").trim();

export const REQUEST_TIMEOUT = 15_000; // ms, per request
export const CATALOG_REVALIDATE = 60;  // seconds: public catalog data is cached on the server this long
