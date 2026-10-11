// Test helper: registers the resolver and fakes the few browser globals the services layer touches.
import { register } from "node:module";
register("./hooks.mjs", import.meta.url);
const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
const win = new EventTarget(); win.localStorage = globalThis.localStorage; globalThis.window = win;
globalThis.document = { cookie: "lang=en" };
