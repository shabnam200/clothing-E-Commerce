import { PRODUCTS, discountPercent } from "@/data/products";
import { formatNumber, formatPrice } from "@/lib/format";

// Server-side view model: language-ready, serialisable. Reuses V1 data + V1 translated names.
export function buildV2Products(t, lang) {
  return PRODUCTS.map((p, i) => {
    const [name, categoryKey] = t.shop.items[p.id];
    const d = discountPercent(p);
    return {
      id: p.id, name, image: p.image, tone: (i % 6) + 1,
      category: t.categories.names[categoryKey],
      price: formatPrice(p.price, lang), mrp: d > 0 ? formatPrice(p.mrp, lang) : null,
      discountText: d > 0 ? `-${formatNumber(d, lang)}%` : null,
      colors: p.colors.map(([key, hex]) => ({ key, hex })),
    };
  });
}
