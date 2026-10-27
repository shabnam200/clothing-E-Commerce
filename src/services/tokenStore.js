// Login token. Session-scoped in the browser; plain memory when storage is unavailable.
import { getSessionStorage } from "@/lib/browserStorage";
const KEY = "avenor_token";
let mem = null;
const storage = () => getSessionStorage(KEY);

export const tokenStore = {
  get() { const s = storage(); try { return s ? s.getItem(KEY) : mem; } catch { return mem; } },
  set(t) { mem = t; try { storage()?.setItem(KEY, t); } catch { /* private mode */ } },
  clear() { mem = null; try { storage()?.removeItem(KEY); } catch { /* private mode */ } },
};
