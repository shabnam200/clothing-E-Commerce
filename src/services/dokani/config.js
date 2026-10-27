// ---------------------------------------------------------------------------
// Dokani Cloud adapter settings. SERVER ONLY: never import anything from services/dokani/ in a "use client" file.
// The credentials come from .env.local WITHOUT the NEXT_PUBLIC_ prefix, so Next.js never sends them to the browser.
// ---------------------------------------------------------------------------
export const cfg = () => ({
  baseUrl: (process.env.DOKANI_BASE_URL || "").replace(/\/$/, ""), // https://app.dokani.cloud/api
  login: process.env.DOKANI_LOGIN || "",                            // the shop admin's login (email / phone)
  password: process.env.DOKANI_PASSWORD || "",
  shopId: String(process.env.DOKANI_SHOP_ID || "").trim(),          // safety check only (see client.js assertShop)
  branchId: String(process.env.DOKANI_BRANCH_ID || "").trim(),      // needed later, when sales are created
});
export const isEnabled = () => { const c = cfg(); return Boolean(c.baseUrl && c.login && c.password); };

export const TOKEN_TTL_MS = 20 * 60 * 60 * 1000; // a Dokani token lived about 22 h in the sample; refresh a little earlier. A 401 also triggers a fresh login.
export const CATALOG_TTL_MS = 60 * 1000;         // products are re-read from Dokani at most once a minute
export const NEW_DAYS = 30;                      // a product created in the last 30 days gets the "new" tag

// Dokani categories are free text ("Men's Clothing", "Pants"); AVENOR has a fixed list:
//   shirts | tshirts | jeans | dresses | kurtas | jackets | shoes | accessories
// 1) the product NAME decides first (first matching rule wins), 2) then the Dokani category NAME below, 3) else DEFAULT_CATEGORY.
// Edit these lists when the shop adds new kinds of products.
export const NAME_RULES = [
  [/panjabi|punjabi|kurta|kurti|fatua/i, "kurtas"],
  [/jacket|hoodie|coat|sweater|cardigan|blazer|windcheater/i, "jackets"],
  [/jeans|denim|trouser|chino|jogger|\bpants?\b/i, "jeans"],
  [/dress|gown|frock|saree|sari|skirt|abaya/i, "dresses"],
  [/polo|t-?shirt|tee\b|tank/i, "tshirts"],
  [/shirt/i, "shirts"],
  [/shoe|sneaker|sandal|loafer|boot|slipper|footwear/i, "shoes"],
  [/wallet|belt|bag|watch|scarf|cap\b|hat\b|sock|glass|tie\b|perfume|accessor|accesor|earrings?|jewel(?:ry|lery)|jewellery|necklaces?|bracelets?|bangles?|pendants?|hair.?clips?/i, "accessories"],
];
export const CATEGORY_MAP = { // lower-case Dokani category name -> AVENOR key
  pants: "jeans", jeans: "jeans", winterwear: "jackets", jackets: "jackets", footwear: "shoes", shoes: "shoes", accessories: "accessories",
  shirts: "shirts", "t-shirts": "tshirts", tshirts: "tshirts", panjabi: "kurtas", kurta: "kurtas", dresses: "dresses",
};
export const DEFAULT_CATEGORY = "accessories";

// Dokani has no gender field. Words in the category or product name decide; the default is "unisex" (listed under Men and Women).
export const GENDER_RULES = [
  [/\b(women|woman|ladies|lady|female|girl'?s?)\b/i, ["women"]],
  [/\b(kids?|child|children|boy'?s?|baby|junior|toddler)\b/i, ["kids"]],
  [/\b(men'?s?|man|male|gents?)\b/i, ["men"]],
];
export const DEFAULT_GENDERS = ["men", "women"];
