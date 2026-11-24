// Decides whether this storefront belongs to a cosmetics client.
// 1) STOREFRONT_NICHE=cosmetics|clothing in .env forces the answer.
// 2) Otherwise the shop's own categories decide (skincare / makeup / haircare / beauty ...).
// Clothing shops never match, so their homepage stays exactly as it was.
const COSMETICS = /skin.?care|make.?up|cosmetic|beauty|hair.?care|fragrance/i;

const walk = (rows = []) => rows.flatMap((c) => [c, ...walk(c?.subs || [])]);

export function isCosmeticsStore(categories = []) {
  const forced = String(process.env.STOREFRONT_NICHE || "").trim().toLowerCase();
  if (forced === "cosmetics") return true;
  if (forced === "clothing") return false;
  return walk(categories).some((c) => COSMETICS.test(`${c?.name ?? ""} ${c?.slug ?? ""}`));
}
