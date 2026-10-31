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
  for (const value of [p.category?.name, p.category?.slug, p.category_name, p.category_slug]) {
    const normalized = String(value || "").toLowerCase().replace(/[’']s\b/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    const words = normalized.split(/\s+/).filter((word) => !["men", "man", "mens", "women", "woman", "womens", "kids", "kid", "children", "boys", "girls"].includes(word));
    const canonical = words.join(" ");
    const compact = canonical.replace(/\s+/g, "");
    if (/accessor|accesor/.test(compact)) return "accessories";
    if (/footwear|shoes?/.test(compact)) return "shoes";
    if (CATEGORY_MAP[canonical]) return CATEGORY_MAP[canonical];
  }
  return DEFAULT_CATEGORY;
}

// This storefront is AVENOR (clothing). Dokani shares a tenant schema/catalog
// with grocery, so only recognized apparel categories or apparel product names
// belong here. In particular, do not let unknown categories fall through to
// DEFAULT_CATEGORY (accessories), which made grocery items look like fashion.
const CLOTHING_CATEGORY = /^(clothes?|clothing|apparel|garments?|fashion|footwear|shoes?|shirts?|t-?shirts?|tshirts|pants|trousers?|jeans|denim|winterwear|jackets?|dresses?|kurtas?|panjabis?|accessories)$/i;
const CLOTHING_NAME = /\b(panjabi|punjabi|kurta|kurti|fatua|jacket|hoodie|coat|sweater|cardigan|blazer|windcheater|jeans|denim|trouser|chino|jogger|pants?|dress|gown|frock|saree|sari|skirt|abaya|polo|t-?shirt|tee|tank|shirt|wallet|belt|bag|watch|scarf|cap|hat|shoe|sneaker|sandal|loafer|sock|glasses|tie|earrings?|jewel(?:ry|lery)|jewellery|necklaces?|bracelets?|bangles?|pendants?|hair.?clips?)\b/i;
export function isClothingProduct(p) {
  const categories = [p?.category?.name, p?.category?.slug, p?.category_name, p?.category_slug].map((value) => String(value || "").toLowerCase().replace(/[’']s\b/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim());
  if (categories.some((category) => CLOTHING_CATEGORY.test(category) || /accessor|accesor|footwear|shoes?/.test(category))) return true;
  return CLOTHING_NAME.test(`${p?.name ?? ""} ${p?.display_name ?? ""} ${p?.model ?? ""}`);
}
export function guessGenders(p) {
  const explicit = String(p.gender ?? "").trim().toLowerCase();
  if (["men", "women", "kids"].includes(explicit)) return [explicit];
  if (explicit === "unisex") return ["men", "women"];
  const hay = `${p.category?.name ?? ""} ${p.category?.slug ?? ""} ${p.category_name ?? ""} ${p.category_slug ?? ""} ${p.name ?? ""}`.replace(/[_-]+/g, " ");
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

const FAMILIES = [["black", /black|charcoal|jet/i], ["white", /white|ivory|cream|off.?white/i], ["pink", /pink|rose|magenta/i], ["blue", /blue|navy|denim|indigo|sky/i], ["brown", /brown|tan|coffee|camel|khaki|beige|sand/i], ["red", /red|maroon|crimson|wine/i], ["green", /green|olive|sage/i], ["gray", /gray|grey|silver/i]];
export const colorFamily = (name) => FAMILIES.find(([, re]) => re.test(name))?.[0];
const COLOR_HEX = { black: "#171717", white: "#f5f2eb", pink: "#e84393", blue: "#416b9b", brown: "#b89b72", red: "#7b1738", green: "#697653", gray: "#777777" };
function inferredColor(p) {
  const label = [p.colour_tint, p.color, p.colour, p.name, p.display_name].filter(Boolean).join(" ");
  const match = FAMILIES.find(([, re]) => re.test(label));
  if (!match) return [];
  const nameMatch = label.match(/\b(charcoal|black|jet black|white|ivory|cream|off.?white|navy|denim|indigo|sky blue|blue|tan|coffee|camel|khaki|beige|sand|brown|maroon|crimson|wine|red|olive|sage|green|gray|grey|silver)\b/i);
  const name = nameMatch?.[0] ?? match[0];
  return [{ name, hex: COLOR_HEX[match[0]], family: match[0] }];
}

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
  const colors = list(p.colours).map((e) => {
    const name = text(e);
    const family = colorFamily(name);
    return { name, hex: (typeof e === "object" && (e.hex ?? e.hex_code ?? e.color_code ?? e.code ?? e.value)) || COLOR_HEX[family] || "#999999" };
  }).filter((c) => c.name);
  // Per-variant stock. The API sends it as variants[].total_stock (older shapes: stock_amount / stock / quantity).
  const rows = list(p.variants).filter((v) => v && v.status !== false && v.status !== 0);
  const variantStock = rows.map((v) => ({
    size: v.size != null && String(v.size).trim() ? normSize(v.size) : null,
    color: v.colour ?? v.color ?? null,
    stock: num(v.total_stock ?? v.stock_amount ?? v.stock ?? v.quantity),
  }));
  return { sizes: [...new Set(sizes)], colors, variantStock, variantTotal: variantStock.length ? variantStock.reduce((t, x) => t + x.stock, 0) : null };
}

export function mapProduct(p, lang = "bn", order = 0, now = Date.now()) {
  const category = guessCategory(p);
  const v = variantsOf(p);
  const sizes = v.sizes.length ? v.sizes : [normSize(p.size)];
  const colors = v.colors.length ? v.colors.map((c) => ({ ...c, family: colorFamily(c.name) })) : inferredColor(p);

  // price: shop_price is the selling price, mrp the printed price. A Dokani discount lowers the selling price.
  const base = num(p.shop_price);
  let price = base, mrp = num(p.mrp) > base ? num(p.mrp) : null;
  const campaignDiscount = num(p.campaign_discount_value) > 0;
  const discountType = campaignDiscount ? p.campaign_discount_type : p.discount_type;
  const discountValue = campaignDiscount ? num(p.campaign_discount_value) : num(p.discount_value);
  if ((campaignDiscount || p.has_discount) && discountValue > 0) {
    price = Math.max(0, Math.round(discountType === "percentage" ? base * (1 - discountValue / 100) : base - discountValue));
    mrp = Math.max(mrp ?? 0, base) || base;
  }

  const created = parseDate(p.created_at);
  const tags = [];
  if (mrp && price < mrp) tags.push("sale");
  if (created && now - +created < NEW_DAYS * 86_400_000) tags.push("new");

  const photos = [p.cover_image_url].filter(Boolean);
  const images = photos.length ? photos : [placeholderFor(category)];
  const stock = v.variantTotal ?? num(p.stock?.stock_amount); // with variants the product stock is the sum of its variants

  const item = toCatalogItem({
    id: p.id, name: p.display_name || p.name, name_en: p.name, description: p.description ?? "", created_at: created ? +created : 0, sold_total: num(p.sold_total ?? p.soldTotal), category, genders: guessGenders(p), tags, sizes, colors,
    stock, price, mrp, rating: num(p.rating), reviews_count: num(p.review_count ?? p.reviews_count), sku: p.barcode || undefined,
    material: p.material ?? undefined, fit: p.fit ?? undefined, care: p.care ?? undefined,
    image: images[0], images, hover_image: images[1] ?? null, color_image_urls: p.color_image_urls ?? {}, variant_stock: v.variantStock,
  }, lang, order);
  return { ...item, source: "dokani", dokaniModel: p.model ?? "", hasPhoto: photos.length > 0 };
}

// Active, non-service products only.
export const isSellable = (p) => p && Number(p.status) === 1 && !p.is_service && p.web_visible !== false && Number(p.web_visible ?? 1) !== 0;

