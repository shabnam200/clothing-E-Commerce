import { V2_BASE } from "@/config/v2";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";

export const TAGS = ["sale", "new", "best"];
export const SORTS = ["featured", "priceAsc", "priceDesc", "rating"];
export const GENDER_KEYS = V2_GENDERS.map((g) => g.key);
export const CATEGORY_KEYS = V2_CATEGORIES.map((c) => c.key);

const one = (v) => (Array.isArray(v) ? v[0] : v);

// Reads and validates ?gender=&category=&tag=&q=&sort= (unknown values are ignored, never trusted).
export function parseShopParams(sp = {}) {
  const gender = one(sp.gender), category = one(sp.category), tag = one(sp.tag), sort = one(sp.sort);
  return {
    gender: GENDER_KEYS.includes(gender) ? gender : "",
    category: CATEGORY_KEYS.includes(category) ? category : "",
    tag: TAGS.includes(tag) ? tag : "",
    sort: SORTS.includes(sort) ? sort : "featured",
    q: (one(sp.q) ?? "").toString().trim().slice(0, 80),
  };
}

export function filterProducts(items, { gender, category, tag, q, sort }) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const out = items.filter((p) =>
    (!gender || p.genders.includes(gender)) && (!category || p.category === category) && (!tag || p.tags.includes(tag)) &&
    words.every((w) => p.haystack.includes(w)));
  if (sort === "priceAsc") out.sort((a, b) => a.price - b.price);
  else if (sort === "priceDesc") out.sort((a, b) => b.price - a.price);
  else if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
  return out;
}

// Builds /v2/shop?... from a filter object, dropping empty / default values.
export function shopHref(f = {}) {
  const sp = new URLSearchParams();
  for (const k of ["gender", "category", "tag", "q"]) if (f[k]) sp.set(k, f[k]);
  if (f.sort && f.sort !== "featured") sp.set("sort", f.sort);
  const qs = sp.toString();
  return qs ? `${V2_BASE}/shop?${qs}` : `${V2_BASE}/shop`;
}
