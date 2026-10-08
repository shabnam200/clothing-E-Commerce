// Tiny persisted external store (same pattern as lib/v2/store.js, reusable for any small slice of state).
// Read with useSyncExternalStore so server HTML and the first client render always match.
const noop = () => {};

export function createLocalStore(key, empty, clean) {
  let state = empty;
  let loaded = false;
  const listeners = new Set();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = clean(JSON.parse(raw));
    } catch { state = empty; }
  }

  return {
    getSnapshot() { load(); return state; },
    getServerSnapshot: () => empty,
    subscribe(fn) {
      if (typeof window === "undefined") return noop;
      listeners.add(fn);
      const onStorage = (e) => { if (e.key === key) { loaded = false; state = empty; load(); fn(); } }; // another tab changed it
      window.addEventListener("storage", onStorage);
      return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
    },
    set(updater) {
      load();
      state = clean(typeof updater === "function" ? updater(state) : updater);
      try { window.localStorage.setItem(key, JSON.stringify(state)); } catch { /* private mode / quota: keep working in memory */ }
      listeners.forEach((fn) => fn());
    },
  };
}
