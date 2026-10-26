// Per-variant stock helpers shared by the product card, quick view and the store.
// A product can be "in stock" overall while one exact size/colour is sold out, so every check goes through here.
const same = (a, b) => !a || !b || String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

export const hasVariantStock = (p) => (p?.variantStock || []).length > 0;

export function stockFor(p, size = "", color = "") {
  const vs = p?.variantStock || [];
  if (!vs.length) return Number(p?.stock ?? 10);
  return vs
    .filter((v) => (!size || !v.size || v.size === size) && same(color, v.color))
    .reduce((t, v) => t + Number(v.stock || 0), 0);
}

// Sold out completely (every size and colour).
export const isSoldOut = (p) => stockFor(p, "", "") <= 0;

// Best size/colour that can really be bought, starting from what the shopper prefers. null = nothing is in stock.
export function firstAvailable(p, prefSize = "", prefColor = "") {
  if (isSoldOut(p)) return null;
  const sizes = p.sizes?.length ? p.sizes : [""];
  const colors = p.colors?.length ? p.colors.map((c) => c.name) : [""];
  const ok = (s, c) => stockFor(p, s, c) > 0;
  const tries = [];
  if (prefSize && prefColor) tries.push([prefSize, prefColor]);
  if (prefColor) sizes.forEach((s) => tries.push([s, prefColor]));
  if (prefSize) colors.forEach((c) => tries.push([prefSize, c]));
  sizes.forEach((s) => colors.forEach((c) => tries.push([s, c])));
  const hit = tries.find(([s, c]) => ok(s, c));
  return hit ? { size: hit[0] || "ONE", color: hit[1] } : null;
}
