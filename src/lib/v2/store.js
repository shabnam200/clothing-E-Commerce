// Tiny client store for cart + wishlist, persisted in localStorage (no dependencies).
// Read with useSyncExternalStore (see V2StoreProvider) so server HTML and first client render always match.
// To move to the real backend later: keep these action names and swap the bodies for API calls.
import { MAX_QTY } from "@/config/v2";

const KEY = "avenor:v2:state:v1";
const EMPTY = { cart: [], wish: [] };
let state = EMPTY;
let loaded = false;
const listeners = new Set();

const validLine = (l) => l && Number.isInteger(l.id) && typeof l.size === "string" && Number.isInteger(l.qty) && l.qty > 0;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    state = {
      cart: Array.isArray(p.cart) ? p.cart.filter(validLine).map((l) => ({ ...l, qty: Math.min(l.qty, MAX_QTY) })) : [],
      wish: Array.isArray(p.wish) ? p.wish.filter(Number.isInteger) : [],
    };
  } catch { state = EMPTY; }
}

function commit(next) {
  state = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode / quota: keep working in memory */ }
  listeners.forEach((fn) => fn());
}

export const getSnapshot = () => { load(); return state; };
export const getServerSnapshot = () => EMPTY;
export function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => { if (e.key === KEY) { loaded = false; state = EMPTY; load(); fn(); } }; // another tab changed it
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
}

export const lineKey = (l) => `${l.id}:${l.size}`;

export const actions = {
  add({ id, size, qty = 1 }) {
    load();
    const exists = state.cart.some((l) => l.id === id && l.size === size);
    const cart = exists
      ? state.cart.map((l) => (l.id === id && l.size === size ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
      : [...state.cart, { id, size, qty: Math.min(MAX_QTY, qty) }];
    commit({ ...state, cart });
  },
  setQty(key, qty) {
    load();
    const next = Math.max(0, Math.min(MAX_QTY, qty));
    commit({ ...state, cart: state.cart.flatMap((l) => (lineKey(l) !== key ? [l] : next === 0 ? [] : [{ ...l, qty: next }])) });
  },
  remove(key) { load(); commit({ ...state, cart: state.cart.filter((l) => lineKey(l) !== key) }); },
  clear() { load(); commit({ ...state, cart: [] }); },
  toggleWish(id) { load(); commit({ ...state, wish: state.wish.includes(id) ? state.wish.filter((x) => x !== id) : [...state.wish, id] }); },
};
