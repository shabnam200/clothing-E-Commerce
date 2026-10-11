// Login token. localStorage in the browser; plain memory when there is no storage (server render, private mode).
const KEY = "avenor_token";
let mem = null;
const ls = () => { try { return typeof window !== "undefined" && window.localStorage ? window.localStorage : null; } catch { return null; } };

export const tokenStore = {
  get() { const s = ls(); try { return s ? s.getItem(KEY) : mem; } catch { return mem; } },
  set(t) { mem = t; try { ls()?.setItem(KEY, t); } catch { /* private mode */ } },
  clear() { mem = null; try { ls()?.removeItem(KEY); } catch { /* private mode */ } },
};
