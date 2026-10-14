// Dokani product -> the shape AVENOR's screens use. Pure functions (no network), easy to test.
// Goes through services/adapters.js toCatalogItem, so a Dokani product looks exactly like any other catalogue item to the UI.
import { toCatalogItem } from "../adapters";
import { V2_CATEGORIES } from "@/data/v2";
import { CATEGORY_MAP, DEFAULT_CATEGORY, DEFAULT_GENDERS, GENDER_RULES, NAME_RULES, NEW_DAYS } from "./config";

const num = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const list = (x) => (Array.isArray(x) ? x : Array.isArray(x?.data) ? x.data : []);
const text = (e) => (typeof e === "string" ? e : String(e?.name ?? e?.title ?? e?.size ?? e?.colour ?? e?.color ?? e?.label ?? "").trim());

export function guessCategory(p) {
  const hay = `${p.name ?? ""} ${p.model ?? ""}`;
  for (const [re, key] of NAME_RULES) if (re.test(hay)) return key;
  return CATEGORY_MAP[String(p.category?.name ?? "").trim().toLowerCase()] || DEFAULT_CATEGORY;
}
export function guessGenders(p) {
  const hay = `${p.category?.name ?? ""} ${p.name ?? ""}`;
  for (const [re, g] of GENDER_RULES) if (re.test(hay)) return g;
  return DEFAULT_GENDERS;
}

// AVENOR understands: S M L XL (XS XXL XXXL), jeans waist 28..34 (two digits), kids 4Y..10Y, ONE. Anything empty / "Free" becomes ONE.
export function normSize(v) {
  const s = String(v ?? "").trim();
  if (!s || /^(free|free\s*size|one|one\s*size|onesize|os|na|n\/a|-)$/i.test(s)) return "ONE";
  const up = s.toUpperCase().replace(/\s+/g, "");
  if (up === "2XL") return "XXL";
  if (up === "3XL") return "XXXL";
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL)$/.test(up) || /^\d{1,2}Y$/.test(up) || /^\d{2}$/.test(up)) return up;
  return s;
}

const FAMILIES = [["black", /black|charcoal|jet/i], ["white", /white|ivory|cream|off.?white/i], ["blue", /blue|navy|denim|indigo|sky/i], ["brown", /brown|tan|coffee|camel|khaki|beige/i], ["red", /red|maroon|crimson|wine/i]];
export const colorFamily = (name) => FAMILIES.find(([, re]) => re.test(name))?.[0];

// "12-10-2026" (DD-MM-YYYY, as Dokani writes it) or an ISO date -> Date | null
export function parseDate(s) {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(String(s ?? ""));
  const d = m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : new Date(s);
  return Number.isNaN(+d) ? null : d;
}

export function placeholderFor(categoryKey) {
  return V2_CATEGORIES.find((c) => c.key === categoryKey)?.image ?? V2_CATEGORIES[0].image; // an image that already ships with the site
}

// Variants. Dokani exposes is_size / is_colour / sizes[] / colours[] / variants[] (empty until a product has variants switched on).
// The exact shape of those arrays is still to be confirmed with a real sample, so this reads them leniently: a string, or an object with name/title/size/colour/label (+ hex/code for colours).
function variantsOf(p) {
  const sizes = p.is_size ? list(p.sizes).map((e) => normSize(text(e))).filter(Boolean) : [];
  const colors = p.is_colour ? list(p.colours).map((e) => ({ name: text(e), hex: (typeof e === "object" && (e.hex ?? e.hex_code ?? e.color_code ?? e.code ?? e.value)) || "#999999" })).filter((c) => c.name) : [];
  const vStock = list(p.variants).map((v) => v?.stock_amount ?? v?.stock ?? v?.quantity).filter((x) => x !== undefined && x !== null);
  return { sizes: [...new Set(sizes)], colors, variantStock: vStock.length ? vStock.reduce((s, x) => s + num(x), 0) : null };
}

export function mapProduct(p, lang = "bn", order = 0, now = Date.now()) {
  const category = guessCategory(p);
  const v = variantsOf(p);
  const sizes = v.sizes.length ? v.sizes : [normSize(p.size)];
  const colors = v.colors.map((c) => ({ ...c, family: colorFamily(c.name) }));

  // price: shop_price is the selling price, mrp the printed price. A Dokani discount lowers the selling price.
  const base = num(p.shop_price);
  let price = base, mrp = num(p.mrp) > base ? num(p.mrp) : null;
  if (p.has_discount && num(p.discount_value) > 0) {
    price = Math.max(0, Math.round(p.discount_type === "percentage" ? base * (1 - num(p.discount_value) / 100) : base - num(p.discount_value)));
    mrp = Math.max(mrp ?? 0, base) || base;
  }

  const created = parseDate(p.created_at);
  const tags = [];
  if (mrp && price < mrp) tags.push("sale");
  if (created && now - +created < NEW_DAYS * 86_400_000) tags.push("new");

  const photos = [p.cover_image_url, ...(Array.isArray(p.feature_image_urls) ? p.feature_image_urls : [])].filter(Boolean);
  const images = photos.length ? photos : [placeholderFor(category)];
  const stock = v.variantStock ?? num(p.stock?.stock_amount);

  const item = toCatalogItem({
    id: p.id, name: p.name, name_en: p.name, description: p.description ?? "", category, genders: guessGenders(p), tags, sizes, colors,
    stock, price, mrp, rating: 0, reviews_count: 0, sku: p.barcode || p.model_and_size || undefined,
    image: images[0], images, hover_image: images[1] ?? null,
  }, lang, order);
  return { ...item, source: "dokani", dokaniModel: p.model ?? "", hasPhoto: photos.length > 0 };
}

// Active, non-service products only.
export const isSellable = (p) => p && p.status !== 0 && !p.is_service;
