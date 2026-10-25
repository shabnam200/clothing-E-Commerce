// Pure helpers for the order tracking timeline and the cancel page (no React, no browser APIs).

// The normal journey of an order, in order. "cancelled" is a side exit, not a step in this list.
export const TRACK_STEPS = ["pending", "processing", "shipped", "delivered"];
export const FINAL_STATUSES = ["delivered", "cancelled"];

// An order can be cancelled only before it ships (the server checks this too).
export const canCancel = (o) => !!o && ["pending", "processing"].includes(o.status) && !o.returnRequest;

// Why cancelling is not possible (-> copy key in messages orderCancel.blocked), or null when it is possible.
export const cancelBlockedReason = (o) => {
  if (!o) return null;
  if (o.status === "cancelled") return "cancelled";
  if (o.status === "shipped") return "shipped";
  if (o.status === "delivered") return "delivered";
  if (o.returnRequest) return "return";
  return null;
};

// Steps for the timeline: [{ key, state: "done" | "current" | "todo" | "cancelled", at }]
// `at` is the ISO time the step was reached (from the order's status history), or "" when unknown / not reached yet.
export function buildSteps(o) {
  const hist = o?.history || [];
  const at = (s) => hist.find((h) => h.status === s)?.at || (s === "pending" ? o?.date || "" : s === "delivered" && o?.deliveredOn ? `${o.deliveredOn}T12:00:00` : "");
  if (o?.status === "cancelled") {
    const reached = TRACK_STEPS.filter((s) => hist.some((h) => h.status === s));
    const done = (reached.length ? reached : ["pending"]).map((key) => ({ key, state: "done", at: at(key) }));
    return [...done, { key: "cancelled", state: "cancelled", at: o.cancelledAt || at("cancelled") }];
  }
  const idx = Math.max(0, TRACK_STEPS.indexOf(o?.status));
  return TRACK_STEPS.map((key, i) => ({ key, state: i < idx ? "done" : i === idx ? (key === "delivered" ? "done" : "current") : "todo", at: i <= idx ? at(key) : "" }));
}

// Expected delivery window as two Dates: express = next day, standard = 3 to 5 days after the order was placed.
export function estimateWindow(o) {
  const t = Date.parse(o?.date);
  if (Number.isNaN(t)) return null;
  const DAY = 86_400_000;
  const [lo, hi] = o.shipping === "express" ? [1, 1] : [3, 5];
  return { from: new Date(t + lo * DAY), to: new Date(t + hi * DAY) };
}

// Invoice number shown on the invoice: AVN-9012 -> INV-9012 (the real API can send its own `invoice_number` later).
export const invoiceNo = (o) => `INV-${String(o?.number ?? "").replace(/^AVN-/i, "")}`;

// ---- Return / exchange (the page /orders/[id]/return) ----
// The window: a delivered order can be returned until the end of day `days` after its delivery date (the server checks this too).
// -> { open: true, left: daysLeft } | { open: false, left: 0 } | null when the order has not been delivered.
export function returnWindow(o, days) {
  if (!o || o.status !== "delivered" || !o.deliveredOn) return null;
  const deadline = new Date(`${o.deliveredOn}T00:00:00`);
  deadline.setDate(deadline.getDate() + days);
  deadline.setHours(23, 59, 59, 999);
  const ms = deadline - Date.now();
  return ms > 0 ? { open: true, left: Math.min(days, Math.ceil(ms / 864e5)) } : { open: false, left: 0 };
}

// Why a return / exchange is not possible (-> copy key in messages orderReturn.blocked), or null when it is possible.
export const returnBlockedReason = (o, days) => {
  if (!o) return null;
  if (o.status === "cancelled") return "cancelled";
  if (o.returnRequest) return "requested";
  if (o.status !== "delivered" || !o.deliveredOn) return "notDelivered";
  return returnWindow(o, days)?.open ? null : "expired";
};
