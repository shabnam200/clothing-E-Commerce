// ---------------------------------------------------------------------------
// ADAPTERS: the ONLY place that knows the server's JSON field names.
//   server JSON (snake_case, as in the API specification)  <->  the shapes the UI components use (camelCase).
// If the supervisor's API names a field differently, change it here (and nowhere else).
// Every mapper is defensive: a missing field becomes a safe default instead of crashing a page.
// ---------------------------------------------------------------------------
import bn from "@/messages/v2/bn";
import en from "@/messages/v2/en";
import { fmtNum, fmtPrice, fmtRating } from "@/lib/v2/format";

const n = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };
const pick = (o, ...keys) => { for (const k of keys) if (o?.[k] !== undefined && o[k] !== null) return o[k]; return undefined; };

// ---- user ------------------------------------------------------------------
export const toUser = (u = {}) => ({
  id: u.id, name: u.name ?? "", email: u.email ?? "", phone: u.phone ?? "",
  tier: u.tier ?? "Member", points: n(u.points), nextTierPoints: n(pick(u, "next_tier_points", "nextTierPoints"), 0),
});

// ---- catalogue -------------------------------------------------------------
// -> the same item shape lib/v2/catalog.js buildCatalog() produces, so every product component works unchanged.
export function toCatalogItem(r = {}, lang = "bn", order = 0) {
  const m = lang === "en" ? en : bn;
  const id = Number.isInteger(Number(r.id)) ? Number(r.id) : r.id;
  const price = n(pick(r, "price", "shop_price"));
  const mrp = r.mrp != null && n(r.mrp) > price ? n(r.mrp) : null;
  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const genders = Array.isArray(r.genders) ? r.genders : [];
  const colors = (r.colors || r.colours || []).map((c) => ({ name: String(c?.name ?? c?.colour ?? c ?? ""), hex: c?.hex ?? "#999999", family: c?.family }));
  const image = r.image ?? r.cover_image_url ?? r.images?.[0] ?? r.feature_image_urls?.[0] ?? "";
  const images = Array.isArray(r.images) && r.images.length ? r.images : Array.isArray(r.feature_image_urls) && r.feature_image_urls.length ? r.feature_image_urls : image ? [image] : [];
  const rating = n(r.rating);
  const reviews = n(pick(r, "reviews_count", "reviewsCount"));
  const name = String(r.name ?? "");
  const category = String(r.category?.name ?? r.category ?? r.category_name ?? r.category_id ?? "");
  const categoryLabel = pick(r, "category_label", "categoryLabel") ?? m.cats?.names?.[category] ?? category;
  const genderLabels = genders.map((g) => m.cats?.genders?.[g] ?? g);
  const stockValue = r.stock?.stock_amount ?? r.stock;
  const stock = Number.isFinite(Number(stockValue)) && stockValue !== null ? Number(stockValue) : 10;
  return {
    id, key: String(id), order, name, description: r.description ?? "",
    category, categoryLabel, genders, genderLabels, tags: Array.isArray(r.tags) ? r.tags : [], sizes: Array.isArray(r.sizes) ? r.sizes.map((s) => typeof s === "object" ? s.size ?? s.name : s) : [],
    image, images, hoverImage: pick(r, "hover_image", "hoverImage") ?? images[1] ?? null,
    sku: r.sku ?? `AVN-${String(id).padStart(4, "0")}`, reviewsCount: reviews,
    colors, stock, variantStock: Array.isArray(r.variant_stock) ? r.variant_stock : [], price, mrp, discount, rating,
    priceText: fmtPrice(price, lang), mrpText: mrp ? fmtPrice(mrp, lang) : null,
    discountText: discount ? `-${fmtNum(discount, lang)}%` : null,
    ratingText: fmtRating(rating, lang), reviewsText: fmtNum(reviews, lang),
    // optional detail-tab texts (fall back to the per-category copy in messages when absent)
    material: r.material ?? undefined, fit: r.fit ?? undefined, care: r.care ?? undefined,
    // search text: name (current language) + English name + category + gender + colours, so Banglish queries work in Bangla pages too
    haystack: [name, pick(r, "name_en", "nameEn"), categoryLabel, en.cats?.names?.[category], ...genderLabels, category, ...genders, ...colors.map((c) => c.name), ...(r.aliases || [])].filter(Boolean).join(" ").toLowerCase(),
  };
}

export const toReview = (r = {}, i = 0) => ({
  id: r.id ?? i, name: r.name ?? r.shopper_name ?? "", rating: n(r.rating), date: r.date ?? r.created_at ?? "", text: r.text ?? "",
  helpfulCount: n(pick(r, "helpful_count", "helpfulCount")), helpful: Boolean(r.helpful), mine: Boolean(r.mine), verified: Boolean(r.verified),
});
// POST /coupons/validate -> what the checkout shows
export const toCoupon = (c = {}) => ({ code: c.code ?? "", type: c.type ?? c.discount_type ?? "flat", value: n(pick(c, "value", "discount_value")), discount: n(c.discount), message: c.message ?? "", valid: c.valid !== false });
export const toHelpful = (h = {}) => ({ helpful: Boolean(h.helpful ?? true), helpfulCount: n(pick(h, "helpful_count", "helpfulCount")) });
export const toCategory = (r = {}) => ({ key: r.key, name: r.name ?? r.key, image: r.image ?? "" });
export const toGender = (r = {}) => ({ key: r.key, name: r.name ?? r.key, off: n(r.off), image: r.image ?? "" });

// ---- cart ------------------------------------------------------------------
export const toCart = (r = {}) => ({
  items: (r.items || []).map((l) => ({
    itemId: l.id, productId: pick(l, "product_id", "productId"), name: l.name ?? "", image: l.image ?? l.cover_image_url ?? "",
    size: l.size ?? "", color: l.color ?? l.colour ?? "", qty: n(pick(l, "qty", "quantity"), 1),
    unitPrice: n(pick(l, "unit_price", "unitPrice")), lineTotal: n(pick(l, "line_total", "lineTotal")),
    stock: pick(l, "stock", "available_stock") ?? null, maxQty: pick(l, "max_qty", "maxQty", "available_stock") ?? null,
  })),
  count: n(pick(r, "count", "quantity", "item_count")), subtotal: n(r.subtotal), delivery: n(pick(r, "delivery", "delivery_charge")), total: n(pick(r, "total", "grand_total"), n(r.subtotal) + n(pick(r, "delivery", "delivery_charge"))),
});

// ---- orders ----------------------------------------------------------------
export const toOrder = (o = {}) => ({
  id: o.id, number: pick(o, "order_number", "orderNumber") ?? String(o.id ?? ""),
  date: o.date ?? o.created_at ?? "", status: String(o.status ?? "pending").toLowerCase(),
  paymentStatus: pick(o, "payment_status", "paymentStatus") ?? "unpaid",
  subtotal: n(o.subtotal), delivery: n(o.delivery), discount: n(o.discount), coupon: o.coupon ?? null, total: n(o.total),
  itemsCount: n(pick(o, "items_count", "itemsCount"), (o.items || []).reduce((s, i) => s + n(i.qty, 1), 0)),
  deliveredOn: pick(o, "delivered_on", "deliveredOn") ?? null,
  shipping: o.shipping ?? "standard", paymentMethod: pick(o, "payment_method", "paymentMethod") ?? "cod",
  address: o.address ?? "",
  returnRequest: o.return_request ?? o.returnRequest ?? null,
  receiver: { name: pick(o.receiver ?? {}, "name") ?? pick(o, "receiver_name", "receiverName") ?? "", phone: pick(o.receiver ?? {}, "phone") ?? pick(o, "receiver_phone", "receiverPhone", "phone") ?? "", email: pick(o.receiver ?? {}, "email") ?? pick(o, "receiver_email", "receiverEmail", "email") ?? "" },
  district: o.district ?? "", note: o.note ?? "",
  senderNumber: pick(o, "sender_number", "senderNumber") ?? "", trxId: pick(o, "trx_id", "trxId") ?? "",
  items: (o.items || []).map(toOrderItem),
  history: toHistory(o.history ?? o.timeline ?? o.status_history),
  cancelReason: pick(o, "cancel_reason", "cancelReason") ?? null,
  cancelledAt: pick(o, "cancelled_at", "cancelledAt") ?? null,
});
// one purchased line of an order
export const toOrderItem = (i = {}) => ({
  productId: pick(i, "product_id", "productId"), name: i.name ?? "", image: i.image ?? "",
  size: i.size ?? "", color: i.color ?? "", qty: n(i.qty, 1), unitPrice: n(pick(i, "unit_price", "unitPrice")),
});
// status history (order tracking timeline): [{ status, at, note }] oldest first
export const toHistory = (h) => (Array.isArray(h) ? h : []).map((e) => ({
  status: String(e?.status ?? "").toLowerCase(), at: String(e?.at ?? e?.created_at ?? e?.date ?? ""), note: e?.note ?? e?.reason ?? "",
})).filter((e) => e.status);
export const toReturnRequest = (r = {}) => ({ type: r.type === "exchange" ? "exchange" : "return", status: r.status ?? "requested", reason: r.reason ?? "", note: r.note ?? "" });

// UI order form -> POST /orders body
export const fromOrderForm = ({ form, items, shipping }) => ({
  name: form.name.trim(), phone: form.phone.replace(/[\s-]/g, ""), email: form.email?.trim() || undefined,
  district: form.district, address: form.address.trim(), note: form.note?.trim() || undefined,
  shipping, payment_method: form.method, coupon: form.coupon?.trim() || undefined,
  sender_number: ["bkash", "nagad", "rocket"].includes(form.method) ? form.sender.replace(/[\s-]/g, "") : undefined,
  trx_id: form.method !== "cod" ? form.trx.trim() : undefined,
  items: items.map((l) => ({ product_id: l.productId, size: l.size, color: l.color, qty: l.qty })),
});
// server field name -> checkout form field name (used to show server validation errors under the right input)
export const ORDER_FIELD_MAP = { coupon: "coupon", name: "name", phone: "phone", email: "email", district: "district", address: "address", note: "note", sender_number: "sender", trx_id: "trx" };

// ---- addresses / profile / size passport -----------------------------------
export const toAddress = (a = {}) => ({ id: a.id, type: a.type ?? a.label ?? "", address: a.address ?? a.line ?? "", city: a.city ?? "", phone: a.phone ?? "", isDefault: Boolean(pick(a, "is_default", "isDefault")) });
// server numbers/nulls -> the strings the size-passport inputs use
export const toSizePassport = (p = {}) => ({ height: p.height ?? "", weight: p.weight ?? "", chest: p.chest ?? "", waist: p.waist ?? "", age: p.age ?? "" });
export const fromSizePassport = (p = {}) => {
  const out = {};
  for (const k of ["height", "weight", "chest", "waist", "age"]) { const v = parseFloat(p[k]); out[k] = Number.isFinite(v) ? v : null; }
  return out;
};

// ---- price alerts ----------------------------------------------------------
export const toPrefs = (p) => (p ? { sms: Boolean(p.sms), email: Boolean(p.email), phone: p.phone ?? "", emailAddr: pick(p, "email_addr", "emailAddr") ?? "" } : null);
export const fromPrefs = (p) => ({ sms: p.sms, email: p.email, phone: p.sms ? p.phone : undefined, email_addr: p.email ? p.emailAddr : undefined });
export const toAlerts = (r = {}) => {
  const items = {};
  for (const a of r.items || []) {
    const id = pick(a, "product_id", "productId");
    if (id != null) items[String(id)] = { basePrice: n(pick(a, "base_price", "basePrice")), since: String(a.since ?? "") };
  }
  return { prefs: toPrefs(r.prefs), items };
};

// ---- referral --------------------------------------------------------------
export const toReferral = (r = {}) => ({
  code: r.code ?? null, referredBy: pick(r, "referred_by", "referredBy") ?? null,
  invites: (r.invites || []).map((i) => ({ id: String(i.id), name: i.name ?? "", status: i.status === "credited" ? "credited" : "pending", at: String(i.at ?? "") })),
  ledger: (r.ledger || []).map((l) => ({ id: String(l.id), kind: l.kind === "invited" ? "invited" : "inviter", amount: n(l.amount), status: l.status === "credited" ? "credited" : "pending" })),
});

// ---- settings --------------------------------------------------------------
export const toSettings = (r = {}) => {
  const out = {};
  const set = (k, v) => { if (v !== undefined && v !== null) out[k] = v; };
  const setNum = (k, v) => { const x = Number(v); if (v !== undefined && v !== null && v !== "" && Number.isFinite(x)) out[k] = x; }; // fees / limits must be numbers, never strings
  set("currency", r.currency);
  setNum("freeDeliveryOver", pick(r, "free_delivery_over", "freeDeliveryOver"));
  setNum("deliveryFee", pick(r, "delivery_fee", "deliveryFee"));
  setNum("expressFee", pick(r, "express_fee", "expressFee"));
  setNum("maxQtyPerLine", pick(r, "max_qty_per_line", "maxQtyPerLine"));
  setNum("returnWindowDays", pick(r, "return_window_days", "returnWindowDays"));
  setNum("referralReward", pick(r, "referral_reward", "referralReward"));
  setNum("pointsPerTaka", pick(r, "points_per_taka", "pointsPerTaka"));
  set("infoPages", pick(r, "info_pages", "infoPages"));
  set("footerContent", pick(r, "footer_content", "footerContent"));
  set("socialLinks", pick(r, "social_links", "socialLinks"));
  if (Array.isArray(r.districts)) out.districts = r.districts;
  if (r.support) out.support = { phone: r.support.phone, phoneLabel: pick(r.support, "phone_label", "phoneLabel") ?? r.support.phone, whatsapp: r.support.whatsapp, email: r.support.email, address: r.support.address,
    hoursEn: pick(r.support, "hours_en", "hoursEn"), hoursBn: pick(r.support, "hours_bn", "hoursBn"), replyEn: pick(r.support, "reply_en", "replyEn"), replyBn: pick(r.support, "reply_bn", "replyBn") };
  const pa = pick(r, "payment_accounts", "paymentAccounts");
  if (pa) {
    out.paymentAccounts = {};
    for (const k of ["bkash", "nagad", "rocket"]) if (pa[k]) out.paymentAccounts[k] = { number: pa[k].number, type: pa[k].type ?? "Personal" };
    if (pa.bank) out.paymentAccounts.bank = {
      bankName: pick(pa.bank, "bank_name", "bankName"), accName: pick(pa.bank, "account_name", "accName"),
      accNo: pick(pa.bank, "account_number", "accNo"), branch: pa.bank.branch, routing: pa.bank.routing,
    };
  }
  return out;
};

// ---- support topic: the form lists topics by position, the API wants a stable key ---------------
export const SUPPORT_TOPICS = ["order_status", "return_exchange", "payment", "product_size", "other"];
