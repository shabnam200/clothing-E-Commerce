// Referral programme: "Invite a friend, you both get REFERRAL_REWARD in loyalty points".
//
// FRONTEND PREVIEW: code, rewards and invites live in localStorage on this device. A referral between two real
// accounts needs a backend. To go live, keep these function names and swap the bodies for API calls:
//   GET  /api/referrals/me             -> { code, referredBy, invites: [{ id, name, status, at }], ledger: [...] }
//   POST /api/referrals/apply          body { code }  (at sign-up; 422 for unknown / own code / already referred)
//   POST /api/referrals/first-order    (server-side, when the friend's first order is placed or delivered)
// The server must: generate unique codes, reject self-referrals and repeat claims, credit BOTH sides exactly once
// after the friend's first order, and add the points to the loyalty balance.
import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/v2/localStore";
import { POINTS_PER_TAKA, REFERRAL_REWARD, ROUTES } from "@/config/v2";

const EMPTY = { code: null, referredBy: null, invites: [], ledger: [] };
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L: easy to read out loud
const CODE_RE = /^AVN-[23456789A-HJKMNP-Z]{5}$/;

const STATUSES = ["pending", "credited"];
function clean(s) {
  return {
    code: typeof s?.code === "string" && CODE_RE.test(s.code) ? s.code : null,
    referredBy: typeof s?.referredBy === "string" && CODE_RE.test(s.referredBy) ? s.referredBy : null,
    invites: Array.isArray(s?.invites) ? s.invites.filter((i) => i && typeof i.id === "string" && STATUSES.includes(i.status)).map((i) => ({ id: i.id, name: String(i.name ?? ""), status: i.status, at: String(i.at ?? "") })) : [],
    ledger: Array.isArray(s?.ledger) ? s.ledger.filter((l) => l && Number.isFinite(l.amount) && l.amount > 0 && STATUSES.includes(l.status)).map((l) => ({ id: String(l.id), kind: l.kind === "invited" ? "invited" : "inviter", amount: l.amount, status: l.status })) : [],
  };
}

const store = createLocalStore("avenor:v2:referral:v1", EMPTY, clean);
export const useReferral = () => useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

export const normalizeCode = (v) => String(v ?? "").trim().toUpperCase().replace(/\s+/g, "");

function makeCode() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return `AVN-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

// Returns this user's code, creating it the first time. Safe to call from an effect.
export function ensureCode() {
  const cur = store.getSnapshot();
  if (cur.code) return cur.code;
  const code = makeCode();
  store.set((s) => ({ ...s, code }));
  return code;
}

export const inviteLink = (code, origin) => `${origin}${ROUTES.register}?ref=${encodeURIComponent(code)}`;

// Called at sign-up. Returns { ok: true } or { ok: false, reason: "format" | "own" | "used" }.
export function applyCode(input) {
  const code = normalizeCode(input);
  const s = store.getSnapshot();
  if (!CODE_RE.test(code)) return { ok: false, reason: "format" };
  if (code === s.code) return { ok: false, reason: "own" };
  if (s.referredBy) return { ok: false, reason: "used" };
  store.set((cur) => ({ ...cur, referredBy: code, ledger: [...cur.ledger, { id: `invited:${code}`, kind: "invited", amount: REFERRAL_REWARD, status: "pending" }] }));
  return { ok: true };
}

// Called when the friend's first order is placed (a server-side event once the backend exists).
export function completeFirstOrder() {
  store.set((s) => ({ ...s, ledger: s.ledger.map((l) => (l.kind === "invited" && l.status === "pending" ? { ...l, status: "credited" } : l)) }));
}

// Loyalty points from referrals: credited (spendable) and pending (waiting for a first order).
export function referralPoints(s) {
  const sum = (status) => s.ledger.filter((l) => l.status === status).reduce((n, l) => n + l.amount * POINTS_PER_TAKA, 0);
  return { credited: sum("credited"), pending: sum("pending") };
}
