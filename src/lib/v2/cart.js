import { DELIVERY_FEE, FREE_DELIVERY_OVER } from "@/config/v2";
import { lineKey } from "@/lib/v2/store";

// Pure cart maths (kept out of React so it is easy to test and to replace with server-side totals later).
// cart: [{ id, size, qty }]   byId: Map(id -> catalog item)
export function summarize(cart, byId) {
  const lines = cart.flatMap((l) => {
    const p = byId.get(l.id);
    return p ? [{ ...l, key: lineKey(l), p, lineTotal: p.price * l.qty }] : []; // unknown ids (removed products) are skipped
  });
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  return { lines, count, subtotal, delivery, total: subtotal + delivery };
}
