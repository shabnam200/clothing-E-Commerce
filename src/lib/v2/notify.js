// Tiny event so plain modules (no React) can show a toast. V2StoreProvider listens for it.
export function notify(msg, type = "info") {
  if (typeof window === "undefined" || !msg) return;
  window.dispatchEvent(new CustomEvent("avenor:toast", { detail: { msg, type } }));
}
