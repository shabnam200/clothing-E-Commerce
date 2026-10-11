// Referral programme: "Invite a friend, you both get REFERRAL_REWARD in loyalty points".
// The code, invites and rewards live on the server (api.referrals.*). This module keeps a client copy for the account page.
//   At sign-up the code travels inside POST /auth/register (see V2AuthForm), so it is applied together with account creation.
//   The first-order reward (both sides, exactly once) is a server-side event: this file only displays the result.
import { useSyncExternalStore } from "react";
import { createMemoryStore } from "@/lib/v2/localStore";
import { notify } from "@/lib/v2/notify";
import { ROUTES } from "@/config/v2";
import { api } from "@/services";

const EMPTY = { code: null, referredBy: null, invites: [], ledger: [], loaded: false };
export const CODE_RE = /^AVN-[23456789A-HJKMNP-Z]{5}$/;

const store = createMemoryStore(EMPTY, (s) => ({ ...EMPTY, ...s }));
export const useReferral = () => useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

export const normalizeCode = (v) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, "");
export const isValidCode = (v) => CODE_RE.test(normalizeCode(v));
export const inviteLink = (code, origin) => `${origin}${ROUTES.register}?ref=${encodeURIComponent(code)}`;

// (Re)load from the server. Safe to call from an effect; failures are silent (the page shows "…").
export async function refreshReferral() {
  try { store.set({ ...(await api.referrals.me()), loaded: true }); } catch { /* not logged in / offline */ }
}
export const resetReferral = () => store.reset();
// Kept for the existing Refer & earn screen: makes sure the code is loaded (the server creates it the first time).
export const ensureCode = refreshReferral;

// Later use (a code typed after sign-up). Returns { ok: true } or { ok: false, reason: "format" | "own" | "used" | "unknown" }.
export async function applyCode(input) {
  const code = normalizeCode(input);
  if (!CODE_RE.test(code)) return { ok: false, reason: "format" };
  try { await api.referrals.apply(code); await refreshReferral(); return { ok: true }; }
  catch (e) {
    const map = { invalid_format: "format", own_code: "own", already_used: "used", unknown: "unknown" };
    if (map[e.reason]) return { ok: false, reason: map[e.reason] };
    notify(e.message, "error");
    return { ok: false, reason: "error" };
  }
}

// Loyalty points from referrals: credited (spendable) and pending (waiting for a first order).
export function referralPoints(s, pointsPerTaka = 1) {
  const sum = (status) => s.ledger.filter((l) => l.status === status).reduce((n, l) => n + l.amount * pointsPerTaka, 0);
  return { credited: sum("credited"), pending: sum("pending") };
}
