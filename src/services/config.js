// ---------------------------------------------------------------------------
// Backend switch (the ONLY place that decides mock vs. real).
//   NEXT_PUBLIC_API_URL empty                    -> MOCK mode: a browser-only fake server (no backend needed)
//   NEXT_PUBLIC_API_URL=https://api.example.com/api -> REAL mode: services/httpApi.js talks to the Laravel API
// Full connection guide: services/README.md
// ---------------------------------------------------------------------------
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
export const USE_MOCK = !API_URL;

// Mock only: artificial delay (ms) so loading states are visible while building. Set 0 to switch off.
export const MOCK_LATENCY = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY ?? 200);

export const REQUEST_TIMEOUT = 15_000; // ms, per request
export const CATALOG_REVALIDATE = 60;  // seconds: public catalog data is cached on the server this long
