// Price-drop alerts for wishlist items. The data lives on the server (api.priceAlerts.*); this module keeps a client-side copy
// so the bell icons and the wishlist page update instantly, then syncs each change to the API ("optimistic update"):
// the screen changes first, and if the API says no the change is rolled back and an error toast is shown.
// The SMS / email itself is sent by a backend job (Laravel scheduler): when product.price < base_price it sends and then lowers base_price.
import { useSyncExternalStore } from "react";
import { createMemoryStore } from "@/lib/v2/localStore";
import { notify } from "@/lib/v2/notify";
import { api } from "@/services";

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

const store = createMemoryStore(EMPTY, clean);
export const getAlerts = () => store.getSnapshot(); // for event handlers (no re-render subscription)
export const useAlerts = () => useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

// Called by the store provider after login / logout.
export async function loadAlerts() { store.set(await api.priceAlerts.get()); }
export const resetAlerts = () => store.reset();
// Local-only removal (the server deletes the alert itself when a product leaves the wishlist).
export const dropAlertLocal = (id) => store.set((s) => { const { [String(id)]: _gone, ...items } = s.items; return { ...s, items }; });

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

// Run an API call; on failure roll the screen back and tell the person. Resolves true / false.
async function sync(rollback, call) {
  try { await call(); return true; }
  catch (e) { rollback(); notify(e.message, "error"); return false; }
}

export async function savePrefs(prefs) {
  const prev = store.getSnapshot().prefs;
  store.set((s) => ({ ...s, prefs }));
  return sync(() => store.set((s) => ({ ...s, prefs: prev })), () => api.priceAlerts.savePrefs(prefs));
}
export async function enableAlert(id, basePrice) {
  const prev = store.getSnapshot().items[String(id)];
  store.set((s) => ({ ...s, items: { ...s.items, [String(id)]: { basePrice, since: new Date().toISOString() } } }));
  return sync(() => store.set((s) => { const items = { ...s.items }; if (prev) items[String(id)] = prev; else delete items[String(id)]; return { ...s, items }; }), () => api.priceAlerts.enable(id, basePrice));
}
export async function disableAlert(id) {
  const prev = store.getSnapshot().items[String(id)];
  dropAlertLocal(id);
  return sync(() => prev && store.set((s) => ({ ...s, items: { ...s.items, [String(id)]: prev } })), () => api.priceAlerts.disable(id));
}
// "Mark as seen": move the baseline to today's price so only a further drop triggers the next alert.
export async function acknowledgeDrop(id, price) {
  const prev = store.getSnapshot().items[String(id)];
  if (!prev) return true;
  store.set((s) => ({ ...s, items: { ...s.items, [String(id)]: { ...prev, basePrice: price } } }));
  return sync(() => store.set((s) => ({ ...s, items: { ...s.items, [String(id)]: prev } })), () => api.priceAlerts.enable(id, price));
}

// id -> { from, to, pct } for every alert whose product is now cheaper than when the alert was set.
export function findDrops(items, catalog) {
  const drops = {};
  for (const p of catalog) {
    const a = items[String(p.id)];
    if (a && p.price < a.basePrice) drops[p.id] = { from: a.basePrice, to: p.price, pct: Math.round(((a.basePrice - p.price) / a.basePrice) * 100) };
  }
  return drops;
}
