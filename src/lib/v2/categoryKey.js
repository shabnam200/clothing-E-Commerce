const GENDER_WORDS = new Set(["men", "man", "mens", "women", "woman", "womens", "kids", "kid", "children", "boys", "girls"]);
const KNOWN = {
  shirts: "shirts", shirt: "shirts", tshirts: "tshirts", tshirt: "tshirts", "t-shirts": "tshirts",
  jeans: "jeans", denim: "jeans", dresses: "dresses", dress: "dresses", kurtas: "kurtas", kurta: "kurtas", panjabi: "kurtas",
  jackets: "jackets", jacket: "jackets", accessories: "accessories", accessory: "accessories", accesories: "accessories", accesory: "accessories",
  shoes: "shoes", shoe: "shoes", footwear: "shoes",
};

export function categoryKey(category = {}) {
  for (const value of [category.name, category.slug, category.key]) {
    const normalized = String(value || "").toLowerCase().replace(/[’']s\b/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    if (!normalized) continue;
    const canonical = normalized.split(/\s+/).filter((word) => !GENDER_WORDS.has(word)).join(" ");
    const compact = canonical.replace(/\s+/g, "");
    const known = KNOWN[normalized] || KNOWN[canonical] || KNOWN[compact];
    if (known) return known;
    if (/accessor|accesor/.test(compact)) return "accessories";
    if (/footwear|shoes?/.test(compact)) return "shoes";
    const key = canonical.replace(/\s+/g, "-");
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) return key;
  }
  return null;
}

export function categoryPathKey(category, parentKey = "") {
  const ownKey = categoryKey(category);
  if (!ownKey) return null;
  return parentKey ? `${parentKey}-${ownKey}` : ownKey;
}

// Finds a category from the key in the URL (?category=...). An exact key wins ("skin-care"); otherwise punctuation is ignored, so links
// written as "skincare" / "skin_care" / the category's name still open the right category. Returns { id, key, name } or null.
export function findCategoryByKey(rows, selectedKey, groupingMode = "category") {
  const walk = (list, parentKey, match) => {
    for (const category of list || []) {
      const key = categoryPathKeyForGrouping(category, parentKey, groupingMode);
      if (key && match(key, category)) return { id: category.id, key, name: category.name };
      const nested = walk(category.subs, key || parentKey, match);
      if (nested) return nested;
    }
    return null;
  };
  const exact = walk(rows, "", (key) => key === selectedKey);
  if (exact) return exact;
  const flat = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const want = flat(selectedKey);
  if (!want) return null;
  return walk(rows, "", (key, category) => flat(key) === want || flat(category.name) === want || flat(category.slug) === want);
}

export function categoryPathKeyForGrouping(category, parentKey = "", groupingMode = "category") {
  const ownKey = categoryKey(category) || (groupingMode === "category"
    ? String(category?.slug || category?.name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    : null);
  if (!ownKey) return null;
  return parentKey ? `${parentKey}-${ownKey}` : ownKey;
}
