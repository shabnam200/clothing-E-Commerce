// Price-drop alerts for wishlist items.
//
// FRONTEND PREVIEW: alerts are kept in localStorage. The SMS / email itself can only be sent by a backend job.
// To go live, keep these function names and swap the bodies for API calls:
//   GET    /api/price-alerts                  -> { prefs, items: [{ productId, basePrice, since }] }
//   PUT    /api/price-alerts/prefs            body { sms, email, phone, emailAddr }
//   PUT    /api/price-alerts/:productId       body { basePrice }       (turn on)
//   DELETE /api/price-alerts/:productId                                 (turn off)
// Backend job (e.g. Laravel scheduler, every 15-60 min): for each active alert where product.price < basePrice,
// send SMS and/or email through the user's saved channels, then set basePrice = product.price so the same drop
// is not sent twice.
import { useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/v2/localStore";

const EMPTY = { prefs: null, items: {} };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/; // 01XXXXXXXXX, with or without +88

const cleanPrefs = (p) => {
  if (!p || typeof p !== "object") return null;
  const out = { sms: Boolean(p.sms), email: Boolean(p.email), phone: String(p.phone ?? "").slice(0, 20), emailAddr: String(p.emailAddr ?? "").slice(0, 120) };
  return out.sms || out.email ? out : null;
};

function clean(s) {
  const items = {};
  for (const [id, v] of Object.entries(s?.items ?? {})) {
    if (v && Number.isFinite(v.basePrice) && v.basePrice > 0) items[id] = { basePrice: v.basePrice, since: String(v.since ?? "") };
  }
  return { prefs: cleanPrefs(s?.prefs), items };
}

const store = createLocalStore("avenor:v2:alerts:v1", EMPTY, clean);
export const getAlerts = () => store.getSnapshot(); // for event handlers (no re-render subscription)
export const useAlerts = () => useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

// Validates the "where should we notify you" form. `msg` holds the translated error strings.
export function validatePrefs(raw, msg) {
  const errors = {};
  const phone = String(raw.phone ?? "").replace(/[\s-]/g, "");
  const emailAddr = String(raw.emailAddr ?? "").trim();
  if (!raw.sms && !raw.email) errors.channel = msg.errChannel;
  if (raw.sms && !BD_PHONE.test(phone)) errors.phone = msg.errPhone;
  if (raw.email && !EMAIL.test(emailAddr)) errors.email = msg.errEmail;
  return { ok: Object.keys(errors).length === 0, errors, prefs: { sms: Boolean(raw.sms), email: Boolean(raw.email), phone, emailAddr } };
}

export const savePrefs = (prefs) => store.set((s) => ({ ...s, prefs }));
export const enableAlert = (id, basePrice) => store.set((s) => ({ ...s, items: { ...s.items, [String(id)]: { basePrice, since: new Date().toISOString() } } }));
export const disableAlert = (id) => store.set((s) => { const { [String(id)]: _gone, ...items } = s.items; return { ...s, items }; });
// "Mark as seen": move the baseline to today's price so only a further drop triggers the next alert.
export const acknowledgeDrop = (id, price) => store.set((s) => (s.items[String(id)] ? { ...s, items: { ...s.items, [String(id)]: { ...s.items[String(id)], basePrice: price } } } : s));

// id -> { from, to, pct } for every alert whose product is now cheaper than when the alert was set.
export function findDrops(items, catalog) {
  const drops = {};
  for (const p of catalog) {
    const a = items[String(p.id)];
    if (a && p.price < a.basePrice) drops[p.id] = { from: a.basePrice, to: p.price, pct: Math.round(((a.basePrice - p.price) / a.basePrice) * 100) };
  }
  return drops;
}
