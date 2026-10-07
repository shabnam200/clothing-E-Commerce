import { V2_BASE } from "@/config/v2";
import { V2_CATEGORIES, V2_GENDERS } from "@/data/v2";

export const TAGS = ["sale", "new", "best"];
export const SORTS = ["featured", "priceAsc", "priceDesc", "rating"];
export const GENDER_KEYS = V2_GENDERS.map((g) => g.key);
export const CATEGORY_KEYS = V2_CATEGORIES.map((c) => c.key);

const one = (v) => (Array.isArray(v) ? v[0] : v);

export function parseShopParams(sp = {}) {
  const gender = one(sp.gender), category = one(sp.category), tag = one(sp.tag), sort = one(sp.sort);
  const availability = one(sp.availability), price = one(sp.price), color = one(sp.color), size = one(sp.size), brand = one(sp.brand);
  
  return {
    gender: GENDER_KEYS.includes(gender) ? gender : "",
    category: CATEGORY_KEYS.includes(category) ? category : "",
    tag: TAGS.includes(tag) ? tag : "",
    sort: SORTS.includes(sort) ? sort : "featured",
    q: (one(sp.q) ?? "").toString().trim().slice(0, 80),
    availability: availability || "",
    price: price || "",
    color: color || "",
    size: size || "",
    brand: brand || "",
  };
}

export function filterProducts(items, { gender, category, tag, q, sort, availability, price, color, size, brand }) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  
  const out = items.filter((p) => {
    // Basic Filters
    if (gender && !p.genders.includes(gender)) return false;
    if (category && p.category !== category) return false;
    if (tag && !p.tags.includes(tag)) return false;
    
    // New Feature Filters
    const stock = p.stock !== undefined ? p.stock : 10;
    if (availability === "in-stock" && stock === 0) return false;
    if (availability === "out-of-stock" && stock > 0) return false;
    
    if (price === "under-500" && p.price >= 500) return false;
    if (price === "500-1000" && (p.price < 500 || p.price > 1000)) return false;
    if (price === "over-1000" && p.price <= 1000) return false;
    
    if (color && !p.colors?.some(c => c.name.toLowerCase() === color.toLowerCase())) return false;
    if (size && !p.sizes?.some(s => s.toLowerCase() === size.toLowerCase())) return false;
    
    // Search words
    if (words.length > 0 && !words.every((w) => p.haystack.includes(w))) return false;
    
    return true;
  });

  if (sort === "priceAsc") out.sort((a, b) => a.price - b.price);
  else if (sort === "priceDesc") out.sort((a, b) => b.price - a.price);
  else if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
  
  return out;
}

export function shopHref(f = {}) {
  const sp = new URLSearchParams();
  for (const k of ["gender", "category", "tag", "q", "availability", "price", "color", "size", "brand"]) {
    if (f[k]) sp.set(k, f[k]);
  }
  if (f.sort && f.sort !== "featured") sp.set("sort", f.sort);
  const qs = sp.toString();
  return qs ? `${V2_BASE}/shop?${qs}` : `${V2_BASE}/shop`;
}