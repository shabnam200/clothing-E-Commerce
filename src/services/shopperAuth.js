// ---------------------------------------------------------------------------
// SHOPPER ACCOUNTS on Dokani Cloud (browser side).   Switch: NEXT_PUBLIC_DOKANI_AUTH=1  (see config.js, services/index.js)
//
//   api.auth.register / login / me / logout / changePassword      api.user.profile / updateProfile
//        |
//        v   same-origin calls to  /api/shopper/<action>   (app/api/shopper/[...path]/route.js -> services/dokani/shopper.js)
//        v   the server adds the shop's service token for register / login, then calls Laravel  /api/auth/*
//
// The shopper token that Laravel returns is kept in tokenStore, exactly like before, and sent as  Authorization: Bearer  on me / profile / password / logout.
// Cart, wishlist, orders... are still the mock: bindShopperSession() turns the real token into a mock session so they keep working (see mockApi.js).
// ---------------------------------------------------------------------------
import { http, unwrap } from "./http";
import { tokenStore } from "./tokenStore";
import { ApiError } from "./errors";
import * as A from "./adapters";

const call = (action, opts = {}) => http(`/api/shopper/${action}`, { base: "", ...opts });

// The real account decides name / email / phone; tier and points still come from the mock until orders are real.
const toUser = (real = {}) => A.toUser({ id: real.id, name: real.name, email: real.email, phone: real.phone, tier: real.tier, points: real.points, next_tier_points: real.next_tier_points });

// The forms show server errors under the right input. Laravel answers 409 ("already exists") and 401 ("wrong password") with a message only,
// so put that message on the email input; every other error keeps its own shape (422 already has errors{field}).
const underEmail = (e, statuses) => (e instanceof ApiError && statuses.includes(e.status) && !e.errors
  ? new ApiError(e.message, { status: e.status, errors: { email: [e.message] }, reason: e.reason, data: e.data }) : e);

async function sessionFrom(r) {
  if (!r?.token || !r?.user) throw new ApiError("The server did not return a login token.");
  tokenStore.set(r.token);
  return { token: r.token, user: toUser(r.user) };
}

export const shopperAuth = {
  auth: {
    // POST /auth/register  (Laravel validates; referral is not part of the Laravel API yet, it only lives in the browser mock)
    async register(b) {
      try { return await sessionFrom(unwrap(await call("register", { method: "POST", auth: false, body: { name: b.name, email: b.email, phone: b.phone, password: b.password } }))); }
      catch (e) { throw underEmail(e, [409]); }
    },
    // POST /auth/login  (the form's "email" field also accepts a mobile number: Laravel decides by the "@")
    async login(b) {
      try { return await sessionFrom(unwrap(await call("login", { method: "POST", auth: false, body: { login: b.email, password: b.password } }))); }
      catch (e) { throw underEmail(e, [401]); }
    },
    // POST /auth/logout  (revokes this device's token). The token is sent by hand so a dead token cannot trigger the "session expired" popup.
    async logout() {
      const t = tokenStore.get();
      if (t) { try { await call("logout", { method: "POST", auth: false, headers: { Authorization: `Bearer ${t}` } }); } catch { /* token may already be dead */ } }
      tokenStore.clear();
    },
    // GET /auth/me  (also re-creates the mock session after a page reload)
    async me() { return toUser(unwrap(await call("me"))); },
    // POST /auth/password  { current, next }  -> 204. Laravel logs every OTHER device out; this one stays.
    async changePassword({ current, next }) { await call("password", { method: "POST", body: { current, next } }); },
  },
  user: {
    // GET /auth/me
    async profile() { return shopperAuth.auth.me(); },
    // PUT /auth/profile  { name, email, phone }
    async updateProfile({ name, email, phone }) {
      const r = unwrap(await call("profile", { method: "PUT", body: { name, email, phone } }));
      return toUser(r);
    },
  },
};
