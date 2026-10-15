// The ONLY file the UI imports data access from:   import { api } from "@/services";
// Mock or real is decided once, in config.js (NEXT_PUBLIC_API_URL).
import { USE_MOCK } from "./config";
import { mockApi, setMockCatalog } from "./mockApi";
import { httpApi } from "./httpApi";
import { shopperAuth } from "./shopperAuth";

// The storefront shopper auth routes require a shop service token. Keep that
// credential on the Next.js server via the same-origin shopper gateway.
export const api = USE_MOCK ? mockApi : {
  ...httpApi,
  auth: shopperAuth.auth,
  user: { ...httpApi.user, profile: shopperAuth.user.profile, updateProfile: shopperAuth.user.updateProfile },
};
// Tell the mock which products exist (used when the catalogue comes from Dokani Cloud). Does nothing with the real API.
export const registerCatalog = (items) => { if (USE_MOCK) setMockCatalog(items); };
export { USE_MOCK, API_URL } from "./config";
export { ApiError } from "./errors";
export { tokenStore } from "./tokenStore";
export { currentLang } from "./http";
