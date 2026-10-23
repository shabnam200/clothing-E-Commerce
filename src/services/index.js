// The ONLY file the UI imports data access from:   import { api } from "@/services";
// Mock or real is decided once, in config.js (NEXT_PUBLIC_API_URL).
import { DOKANI_AUTH, USE_MOCK } from "./config";
import { forgetRealSession, mockApi, restoreRealSession, setMockCatalog } from "./mockApi";
import { httpApi } from "./httpApi";
import { shopperAuth } from "./shopperAuth";
import { tokenStore } from "./tokenStore";

// The storefront shopper auth routes require a shop service token. Keep that
// credential on the Next.js server via the same-origin shopper gateway.
const hybridAuth = {
  ...shopperAuth.auth,
  async register(input) { const session = await shopperAuth.auth.register(input); restoreRealSession(session.user, session.token); return session; },
  async login(input) { const session = await shopperAuth.auth.login(input); restoreRealSession(session.user, session.token); return session; },
  async me() { const user = await shopperAuth.auth.me(); restoreRealSession(user, tokenStore.get()); return user; },
  async logout() { const token = tokenStore.get(); await shopperAuth.auth.logout(); forgetRealSession(token); },
};

export const api = USE_MOCK ? (DOKANI_AUTH ? {
  ...mockApi,
  auth: hybridAuth,
  user: { ...mockApi.user, profile: shopperAuth.user.profile, updateProfile: shopperAuth.user.updateProfile },
} : mockApi) : {
  ...httpApi,
  auth: shopperAuth.auth,
  user: { ...httpApi.user, profile: shopperAuth.user.profile, updateProfile: shopperAuth.user.updateProfile },
};
// Tell the mock which products exist (used when the catalogue comes from Dokani Cloud). Does nothing with the real API.
export const registerCatalog = (items) => { if (USE_MOCK) setMockCatalog(items); };
export { USE_MOCK, DOKANI_AUTH, API_URL } from "./config";
export { ApiError } from "./errors";
export { tokenStore } from "./tokenStore";
export { currentLang } from "./http";
