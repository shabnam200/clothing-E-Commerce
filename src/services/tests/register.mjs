// Test helper: registers the resolver and fakes the few browser globals the services layer touches.
import { register } from "node:module";
register("./hooks.mjs", import.meta.url);
const makeStorage = (store) => ({ getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), key: (i) => [...store.keys()][i] ?? null, get length() { return store.size; } });
globalThis.localStorage = makeStorage(new Map());
globalThis.sessionStorage = makeStorage(new Map());
const win = new EventTarget(); win.localStorage = globalThis.localStorage; win.sessionStorage = globalThis.sessionStorage; globalThis.window = win;
globalThis.document = { cookie: "lang=en" };
