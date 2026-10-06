import { V2_PRODUCTS } from "@/data/v2";
import en from "@/messages/v2/en";
import { fmtNum, fmtPrice, fmtRating } from "@/lib/v2/format";

export function buildCatalog(v2, lang) {
  return V2_PRODUCTS.map((x, i) => {
    const name = v2.products.items[x.key];
    const categoryLabel = v2.cats.names[x.category];
    const genderLabels = x.genders.map((g) => v2.cats.genders[g]);
    const discount = x.mrp ? Math.round(((x.mrp - x.price) / x.mrp) * 100) : 0;
    return {
      id: x.id, key: x.key, order: i, name, description: v2.products.desc[x.key],
      category: x.category, categoryLabel, genders: x.genders, genderLabels, tags: x.tags, sizes: x.sizes, image: x.image,
      
      // NEW: Added colors and stock from data[cite: 20]
      colors: x.colors || [], 
      stock: x.stock !== undefined ? x.stock : 10,
      
      price: x.price, mrp: x.mrp, discount, rating: x.rating,
      priceText: fmtPrice(x.price, lang), mrpText: x.mrp ? fmtPrice(x.mrp, lang) : null,
      discountText: discount ? `-${fmtNum(discount, lang)}%` : null,
      ratingText: fmtRating(x.rating, lang), reviewsText: fmtNum(x.reviews, lang),
      haystack: [name, categoryLabel, ...genderLabels, en.products.items[x.key], en.cats.names[x.category], x.category, ...x.genders].join(" ").toLowerCase(),
    };
  });
}

export const findProduct = (catalog, id) => catalog.find((p) => String(p.id) === String(id)) ?? null;

export function relatedProducts(catalog, product, count = 4) {
  const others = catalog.filter((p) => p.id !== product.id);
  const score = (p) => (p.category === product.category ? 2 : 0) + (p.genders.some((g) => product.genders.includes(g)) ? 1 : 0);
  return others.sort((a, b) => score(b) - score(a) || a.order - b.order).slice(0, count);
}